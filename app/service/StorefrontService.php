<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Merchant;
use app\model\Product;

/**
 * 买家前台:商店与商品浏览(公开,无需登录)。
 */
class StorefrontService
{
    /**
     * 按店铺标识展示在售商品。
     */
    public function store(string $slug): array
    {
        $m = Merchant::where('store_slug', $slug)->where('status', Merchant::STATUS_ACTIVE)->find();
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '店铺不存在或未开放');
        }

        $products = Product::where('merchant_id', $m->id)
            ->where('status', Product::STATUS_ON)
            ->order('sort', 'asc')->order('id', 'desc')
            ->field(['id', 'title', 'price', 'stock', 'category_id', 'min_buy', 'max_buy'])
            ->select()
            ->toArray();

        return [
            'store'    => ['name' => $m->store_name, 'slug' => $m->store_slug],
            'products' => $products,
        ];
    }

    /**
     * 商品详情(仅在售)。
     */
    public function product(int $id): array
    {
        $p = Product::where('id', $id)->where('status', Product::STATUS_ON)->find();
        if (!$p) {
            throw new BizException(Code::PRODUCT_OFF, '商品不存在或已下架');
        }

        return [
            'id'               => (int) $p->id,
            'merchant_id'      => (int) $p->merchant_id,
            'title'            => $p->title,
            'price'            => $p->price,
            'description'      => $p->description,
            'stock'            => (int) $p->stock,
            'min_buy'          => (int) $p->min_buy,
            'max_buy'          => (int) $p->max_buy,
            'delivery_message' => $p->delivery_message,
        ];
    }
}
