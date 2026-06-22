<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Category;
use app\model\Product;
use app\util\Money;

/**
 * 商户商品管理。所有操作限定当前商户。
 */
class ProductService
{
    private const EDITABLE = ['category_id', 'title', 'sku', 'description', 'image', 'price', 'market_price', 'discount_price', 'discount_start', 'discount_end', 'type', 'goods_type', 'min_buy', 'max_buy', 'delivery_message', 'resource_url', 'purchase_notice', 'show_stock_type', 'sort'];

    public function list(int $merchantId, array $filter = []): array
    {
        $q = Product::where('merchant_id', $merchantId);
        if (isset($filter['category_id']) && $filter['category_id'] !== '') {
            $q->where('category_id', (int) $filter['category_id']);
        }
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        return $q->order('sort', 'asc')->order('id', 'desc')->select()->toArray();
    }

    public function create(int $merchantId, array $d): Product
    {
        $this->assertCategory($merchantId, $d['category_id'] ?? null);

        $minBuy = isset($d['min_buy']) ? max(1, (int) $d['min_buy']) : 1;
        $maxBuy = isset($d['max_buy']) ? (int) $d['max_buy'] : 0;
        $this->assertBuyRange($minBuy, $maxBuy);
        $discountPrice = $this->normalizeDiscountPrice($d['discount_price'] ?? null, (string) $d['price']);

        return Product::create([
            'merchant_id'      => $merchantId,
            'category_id'      => !empty($d['category_id']) ? (int) $d['category_id'] : null,
            'title'            => $d['title'],
            'sku'              => $d['sku'] ?? null,
            'description'      => $d['description'] ?? null,
            'image'            => !empty($d['image']) ? $d['image'] : null,
            'price'            => $d['price'],
            'market_price'     => (isset($d['market_price']) && $d['market_price'] !== '') ? $d['market_price'] : null,
            'discount_price'   => $discountPrice,
            'discount_start'   => !empty($d['discount_start']) ? $d['discount_start'] : null,
            'discount_end'     => !empty($d['discount_end']) ? $d['discount_end'] : null,
            'type'             => isset($d['type']) ? (int) $d['type'] : Product::TYPE_AUTO,
            'goods_type'       => $this->normalizeGoodsType($d['goods_type'] ?? Product::GOODS_TYPE_CARD),
            'min_buy'          => $minBuy,
            'max_buy'          => $maxBuy,
            'delivery_message' => $d['delivery_message'] ?? null,
            'resource_url'     => (isset($d['resource_url']) && $d['resource_url'] !== '') ? $d['resource_url'] : null,
            'purchase_notice'  => (isset($d['purchase_notice']) && $d['purchase_notice'] !== '') ? $d['purchase_notice'] : null,
            'show_stock_type'  => (isset($d['show_stock_type']) && (int) $d['show_stock_type'] === 1) ? 1 : 0,
            'status'           => isset($d['status']) ? (int) $d['status'] : Product::STATUS_ON,
            'sort'             => (int) ($d['sort'] ?? 0),
        ]);
    }

    public function update(int $merchantId, int $id, array $d): Product
    {
        $p = $this->findOwned($merchantId, $id);
        if (array_key_exists('category_id', $d)) {
            $this->assertCategory($merchantId, $d['category_id']);
            $d['category_id'] = !empty($d['category_id']) ? (int) $d['category_id'] : null;
        }
        if (array_key_exists('market_price', $d) && $d['market_price'] === '') {
            $d['market_price'] = null;
        }
        if (array_key_exists('image', $d) && $d['image'] === '') {
            $d['image'] = null;
        }
        if (array_key_exists('purchase_notice', $d) && $d['purchase_notice'] === '') {
            $d['purchase_notice'] = null;
        }
        if (array_key_exists('show_stock_type', $d)) {
            $d['show_stock_type'] = ((int) $d['show_stock_type'] === 1) ? 1 : 0;
        }
        if (array_key_exists('goods_type', $d)) {
            $d['goods_type'] = $this->normalizeGoodsType($d['goods_type']);
        }
        foreach (['discount_start', 'discount_end'] as $k) {
            if (array_key_exists($k, $d) && empty($d[$k])) {
                $d[$k] = null;
            }
        }
        if (array_key_exists('discount_price', $d)) {
            // 校验相对 合并后价格(未传 price 则用现价)
            $effPrice = array_key_exists('price', $d) ? (string) $d['price'] : (string) $p->price;
            $d['discount_price'] = $this->normalizeDiscountPrice($d['discount_price'], $effPrice);
        }
        if (array_key_exists('min_buy', $d)) {
            $d['min_buy'] = max(1, (int) $d['min_buy']);
        }
        if (array_key_exists('max_buy', $d)) {
            $d['max_buy'] = (int) $d['max_buy'];
        }
        // 用合并后的有效值校验:未传字段回退现值。
        $minBuy = array_key_exists('min_buy', $d) ? (int) $d['min_buy'] : (int) $p->min_buy;
        $maxBuy = array_key_exists('max_buy', $d) ? (int) $d['max_buy'] : (int) $p->max_buy;
        $this->assertBuyRange($minBuy, $maxBuy);

        $patch = array_intersect_key($d, array_flip(self::EDITABLE));
        if ($patch) {
            $p->save($patch);
        }
        return $p;
    }

    public function setStatus(int $merchantId, int $id, int $status): Product
    {
        $p = $this->findOwned($merchantId, $id);
        $p->save(['status' => $status === Product::STATUS_ON ? Product::STATUS_ON : Product::STATUS_OFF]);
        return $p;
    }

    public function delete(int $merchantId, int $id): void
    {
        $p = $this->findOwned($merchantId, $id);
        // 有交易/库存数据的商品禁止硬删(spec §10.1)
        if (Card::where('product_id', $id)->count() > 0) {
            throw new BizException(Code::STATE_INVALID, '商品下存在卡密,请先清空卡密再删除');
        }
        $p->delete();
    }

    private function findOwned(int $merchantId, int $id): Product
    {
        $p = Product::find($id);
        if (!$p) {
            throw new BizException(Code::NOT_FOUND, '商品不存在');
        }
        if ((int) $p->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        return $p;
    }

    /**
     * 校验起购/限购区间:max_buy=0 表示不限购;>0 时不得小于 min_buy,
     * 否则该商品任何数量都买不了(min..max 区间为空)。
     */
    private function assertBuyRange(int $minBuy, int $maxBuy): void
    {
        if ($maxBuy > 0 && $maxBuy < $minBuy) {
            throw new BizException(Code::PARAM_ERROR, '限购数量不能小于起购数量');
        }
    }

    /**
     * 限时折扣价规整:空→null(取消);设置则必须为正且 < price(否则报错,避免"折扣价≥原价"误配)。
     */
    private function normalizeDiscountPrice($v, string $price): ?string
    {
        if ($v === null || $v === '' || $v === '0' || $v === '0.00') {
            return null;
        }
        $dp = Money::add((string) $v, '0');
        if (Money::cmp($dp, '0') <= 0) {
            return null;
        }
        if (Money::cmp($dp, $price) >= 0) {
            throw new BizException(Code::PARAM_ERROR, '限时折扣价必须低于原价');
        }
        return $dp;
    }

    /** 商品类型规整:非法值回退卡密(1)。 */
    private function normalizeGoodsType($goodsType): int
    {
        $t = (int) $goodsType;
        return in_array($t, Product::GOODS_TYPES, true) ? $t : Product::GOODS_TYPE_CARD;
    }

    private function assertCategory(int $merchantId, $categoryId): void
    {
        if (!empty($categoryId)) {
            $c = Category::find((int) $categoryId);
            if (!$c || (int) $c->merchant_id !== $merchantId) {
                throw new BizException(Code::PARAM_ERROR, '分类不存在或不属于你');
            }
        }
    }
}
