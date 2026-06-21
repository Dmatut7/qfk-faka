<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Product;
use think\facade\Db;

/**
 * 卡密管理服务(导入 / 列表 / 作废 / 删除 / 库存统计)。
 *
 * 注:本服务负责"入库与维护";并发安全的"取卡发放(一卡一售)"由
 * 独立的发卡逻辑(M5)负责,见 spec §6/§10.3。
 */
class CardService
{
    /**
     * 批量导入卡密(文本按行)。返回 {imported, duplicated, empty, total, stock}。
     *
     * - 行内去重 + 与库内已存在去重(uniq product_id+secret_hash);
     * - 去除每行首尾空白,空行跳过;
     * - 同事务内相对增量 product.stock。
     */
    public function import(int $merchantId, int $productId, string $raw, ?string $batchNo = null): array
    {
        $product = $this->ownedProduct($merchantId, $productId);

        $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];
        $total = count($lines);

        $empty       = 0;
        $internalDup = 0;
        $seen        = [];        // hash => secret(已去重的候选)
        foreach ($lines as $line) {
            $s = trim((string) $line);
            if ($s === '') {
                $empty++;
                continue;
            }
            $hash = Card::hashSecret($s);
            if (isset($seen[$hash])) {
                $internalDup++;
                continue;
            }
            $seen[$hash] = $s;
        }

        // 库内已存在的指纹
        $existing = [];
        if ($seen) {
            $existing = Card::where('product_id', $productId)
                ->whereIn('secret_hash', array_keys($seen))
                ->column('secret_hash');
        }
        $existingSet = array_flip($existing);

        $now  = date('Y-m-d H:i:s');
        $rows = [];
        $dbDup = 0;
        foreach ($seen as $hash => $secret) {
            if (isset($existingSet[$hash])) {
                $dbDup++;
                continue;
            }
            $rows[] = [
                'merchant_id' => $merchantId,
                'product_id'  => $productId,
                'secret'      => $secret,
                'secret_hash' => $hash,
                'status'      => Card::STATUS_UNSOLD,
                'batch_no'    => $batchNo,
                'create_time' => $now,
                'update_time' => $now,
            ];
        }

        $imported = 0;
        if ($rows) {
            $attempt = 0;
            while (true) {
                try {
                    Db::transaction(function () use ($rows, $productId, $merchantId, &$imported) {
                        // 实际插入行数(并发窗口内被抢先插入的同卡密会被忽略)
                        $imported = $this->insertIgnoringDuplicates($rows);
                        if ($imported > 0) {
                            // 相对增量,且以「实际插入行数」对账,保证 stock 与 cards 真值一致(spec §10.3)
                            Product::where('id', $productId)->where('merchant_id', $merchantId)->inc('stock', $imported)->update();
                        }
                    });
                    break;
                } catch (\think\db\exception\PDOException $e) {
                    // 并发导入重叠卡密会在唯一索引上产生间隙锁竞争 → 死锁(1213),有限次重试
                    if ($this->isDeadlock($e) && ++$attempt < 3) {
                        $imported = 0;
                        usleep(10000 * $attempt);
                        continue;
                    }
                    throw $e;
                }
            }
        }

        return [
            'total'      => $total,
            'imported'   => $imported,
            // 行内 + 库内预检 + 并发窗口内被抢先 的重复都计入 duplicated
            'duplicated' => $internalDup + $dbDup + (count($rows) - $imported),
            'empty'      => $empty,
            'stock'      => (int) Product::where('id', $productId)->value('stock'),
        ];
    }

    /**
     * 批量插入卡密,忽略并发窗口内被抢先插入而冲突的唯一键(uniq_secret),
     * 返回实际插入行数。
     *
     * 先尝试单条多行 insertAll(快路径);若命中 1062 重复键(预检与插入之间被并发
     * 抢先),退化为逐行插入并跳过冲突行 —— 避免整批合法新卡因一行冲突而全部丢失。
     */
    private function insertIgnoringDuplicates(array $rows): int
    {
        try {
            Card::insertAll($rows);
            return count($rows);
        } catch (\think\db\exception\PDOException $e) {
            if (!$this->isDuplicateKey($e)) {
                throw $e;
            }
        }

        $inserted = 0;
        foreach ($rows as $row) {
            try {
                Db::name('cards')->insert($row);
                $inserted++;
            } catch (\think\db\exception\PDOException $e) {
                if (!$this->isDuplicateKey($e)) {
                    throw $e;
                }
                // 重复键:并发已插入同卡密,跳过
            }
        }
        return $inserted;
    }

    private function isDuplicateKey(\Throwable $e): bool
    {
        return false !== strpos($e->getMessage(), 'Duplicate entry');
    }

    private function isDeadlock(\Throwable $e): bool
    {
        $msg = $e->getMessage();
        return false !== stripos($msg, 'Deadlock found') || false !== stripos($msg, 'Lock wait timeout');
    }

    /**
     * 商品卡密列表(可按状态筛选),分页。
     */
    public function list(int $merchantId, int $productId, array $filter = [], int $page = 1, int $size = 20): array
    {
        $this->ownedProduct($merchantId, $productId);

        $q = Card::where('product_id', $productId);
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /**
     * 库存统计:各状态数量 + 商品 stock 缓存。
     */
    public function stats(int $merchantId, int $productId): array
    {
        $product = $this->ownedProduct($merchantId, $productId);
        return [
            'unsold'   => Card::where('product_id', $productId)->where('status', Card::STATUS_UNSOLD)->count(),
            'locked'   => Card::where('product_id', $productId)->where('status', Card::STATUS_LOCKED)->count(),
            'sold'     => Card::where('product_id', $productId)->where('status', Card::STATUS_SOLD)->count(),
            'disabled' => Card::where('product_id', $productId)->where('status', Card::STATUS_DISABLED)->count(),
            'stock'    => (int) $product->stock,
        ];
    }

    /**
     * 作废一张未售卡(0→3),同步 stock 减一。仅未售卡可作废。
     */
    public function disable(int $merchantId, int $cardId): void
    {
        $card = $this->ownedUnsoldCard($merchantId, $cardId);
        Db::transaction(function () use ($card) {
            $now = date('Y-m-d H:i:s');
            // 条件更新守卫:仅当仍未售时作废,affected 必须为 1;
            // 否则说明预检后已被并发下单锁定 → 拒绝(关闭 TOCTOU、防非法 0/1→3 跃迁)
            $affected = Db::name('cards')->where('id', $card->id)->where('status', Card::STATUS_UNSOLD)
                ->update(['status' => Card::STATUS_DISABLED, 'update_time' => $now]);
            if ($affected !== 1) {
                throw new BizException(Code::STATE_INVALID, '卡密已被占用,无法作废');
            }
            Db::name('products')->where('id', $card->product_id)
                ->update(['stock' => Db::raw('GREATEST(stock - 1, 0)'), 'update_time' => $now]);
        });
    }

    /**
     * 删除一张未售卡,同步 stock 减一。仅未售卡可删除。
     */
    public function deleteUnsold(int $merchantId, int $cardId): void
    {
        $card = $this->ownedUnsoldCard($merchantId, $cardId);
        Db::transaction(function () use ($card) {
            $now = date('Y-m-d H:i:s');
            // 同 disable:条件删除 + affected 守卫,杜绝删除已被并发占用的卡
            $deleted = Db::name('cards')->where('id', $card->id)->where('status', Card::STATUS_UNSOLD)->delete();
            if ($deleted !== 1) {
                throw new BizException(Code::STATE_INVALID, '卡密已被占用,无法删除');
            }
            Db::name('products')->where('id', $card->product_id)
                ->update(['stock' => Db::raw('GREATEST(stock - 1, 0)'), 'update_time' => $now]);
        });
    }

    private function ownedProduct(int $merchantId, int $productId): Product
    {
        $p = Product::find($productId);
        if (!$p) {
            throw new BizException(Code::NOT_FOUND, '商品不存在');
        }
        if ((int) $p->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        return $p;
    }

    private function ownedUnsoldCard(int $merchantId, int $cardId): Card
    {
        $card = Card::find($cardId);
        if (!$card) {
            throw new BizException(Code::NOT_FOUND, '卡密不存在');
        }
        if ((int) $card->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        if ((int) $card->status !== Card::STATUS_UNSOLD) {
            throw new BizException(Code::STATE_INVALID, '仅未售卡可操作');
        }
        return $card;
    }
}
