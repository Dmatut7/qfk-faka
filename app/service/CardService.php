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

        $imported = count($rows);
        if ($imported > 0) {
            Db::transaction(function () use ($rows, $productId, $merchantId, $imported) {
                Card::insertAll($rows);
                // 相对增量,绝不读后写绝对赋值(spec §10.3)
                Product::where('id', $productId)->where('merchant_id', $merchantId)->inc('stock', $imported)->update();
            });
        }

        return [
            'total'      => $total,
            'imported'   => $imported,
            'duplicated' => $internalDup + $dbDup,
            'empty'      => $empty,
            'stock'      => (int) Product::where('id', $productId)->value('stock'),
        ];
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
            $card->save(['status' => Card::STATUS_DISABLED]);
            Product::where('id', $card->product_id)->where('stock', '>', 0)->dec('stock')->update();
        });
    }

    /**
     * 删除一张未售卡,同步 stock 减一。仅未售卡可删除。
     */
    public function deleteUnsold(int $merchantId, int $cardId): void
    {
        $card = $this->ownedUnsoldCard($merchantId, $cardId);
        Db::transaction(function () use ($card) {
            $productId = $card->product_id;
            $card->delete();
            Product::where('id', $productId)->where('stock', '>', 0)->dec('stock')->update();
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
