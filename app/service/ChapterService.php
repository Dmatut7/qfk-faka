<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Order;
use app\model\Product;
use app\model\ProductChapter;

/**
 * 知识类商品章节:商户 CRUD + 购前目录(仅标题)+ 购后阅读(验证订单归属、已发货)。
 */
class ChapterService
{
    private const EDITABLE = ['title', 'content', 'sort', 'status'];

    // ===== 商户 =====

    public function listForMerchant(int $merchantId, int $productId): array
    {
        $this->ownedProduct($merchantId, $productId);
        return ProductChapter::where('product_id', $productId)
            ->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
    }

    public function create(int $merchantId, int $productId, array $d): ProductChapter
    {
        $this->ownedProduct($merchantId, $productId);
        $title = trim((string) ($d['title'] ?? ''));
        if ($title === '') {
            throw new BizException(Code::PARAM_ERROR, '章节标题不能为空');
        }
        return ProductChapter::create([
            'product_id'  => $productId,
            'merchant_id' => $merchantId,
            'title'       => $title,
            'content'     => (string) ($d['content'] ?? ''),
            'sort'        => (int) ($d['sort'] ?? 0),
            'status'      => isset($d['status']) ? ((int) $d['status'] === 0 ? 0 : 1) : ProductChapter::STATUS_ON,
        ]);
    }

    public function update(int $merchantId, int $id, array $d): ProductChapter
    {
        $c = $this->ownedChapter($merchantId, $id);
        $patch = array_intersect_key($d, array_flip(self::EDITABLE));
        if (array_key_exists('title', $patch)) {
            $title = trim((string) $patch['title']);
            if ($title === '') {
                throw new BizException(Code::PARAM_ERROR, '章节标题不能为空');
            }
            $patch['title'] = $title;
        }
        if (array_key_exists('sort', $patch)) {
            $patch['sort'] = (int) $patch['sort'];
        }
        if (array_key_exists('status', $patch)) {
            $patch['status'] = (int) $patch['status'] === 0 ? 0 : 1;
        }
        if ($patch) {
            $c->save($patch);
        }
        return $c;
    }

    public function delete(int $merchantId, int $id): void
    {
        $this->ownedChapter($merchantId, $id)->delete();
    }

    // ===== 公开 / 买家 =====

    /** 购前目录:仅返回上架章节的标题(不含正文),供商品详情页展示 TOC。 */
    public function tocForProduct(int $productId): array
    {
        return ProductChapter::where('product_id', $productId)
            ->where('status', ProductChapter::STATUS_ON)
            ->order('sort', 'asc')->order('id', 'asc')
            ->field(['id', 'title'])
            ->select()
            ->toArray();
    }

    /** 购后阅读:验证订单归属 + 已发货 + 知识类,返回全文章节。 */
    public function chaptersForOrder(string $orderNo, ?string $email, ?string $password): array
    {
        $order = (new BuyerOrderService())->verifiedOrder($orderNo, $email, $password);
        if ((int) $order->status !== Order::STATUS_DELIVERED) {
            throw new BizException(Code::STATE_INVALID, '订单未完成发货,暂不可阅读');
        }
        if ((int) $order->goods_type !== Product::GOODS_TYPE_KNOWLEDGE) {
            throw new BizException(Code::STATE_INVALID, '该订单非知识类商品');
        }
        $rows = ProductChapter::where('product_id', $order->product_id)
            ->where('status', ProductChapter::STATUS_ON)
            ->order('sort', 'asc')->order('id', 'asc')
            ->field(['id', 'title', 'content'])
            ->select()->toArray();

        return array_map(static function ($c) {
            return ['id' => (int) $c['id'], 'title' => $c['title'], 'content' => (string) $c['content']];
        }, $rows);
    }

    // ===== 内部 =====

    private function ownedProduct(int $merchantId, int $productId): Product
    {
        $p = Product::find($productId);
        if (!$p) {
            throw new BizException(Code::NOT_FOUND, '商品不存在');
        }
        if ((int) $p->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人商品');
        }
        return $p;
    }

    private function ownedChapter(int $merchantId, int $id): ProductChapter
    {
        $c = ProductChapter::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '章节不存在');
        }
        if ((int) $c->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人章节');
        }
        return $c;
    }
}
