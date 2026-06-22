<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Announcement;
use app\model\Category;
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
            ->field(['id', 'title', 'price', 'market_price', 'stock', 'image', 'category_id', 'goods_type', 'sales_count', 'min_buy', 'max_buy', 'purchase_notice', 'show_stock_type'])
            ->select()
            ->toArray();

        $products = array_map(static function ($p) {
            return [
                'id'           => (int) $p['id'],
                'title'        => $p['title'],
                'price'        => $p['price'],
                'market_price' => $p['market_price'],
                'stock'        => (int) $p['stock'],
                'image'        => $p['image'],
                'category_id'  => isset($p['category_id']) ? (int) $p['category_id'] : null,
                'goods_type'   => (int) ($p['goods_type'] ?? Product::GOODS_TYPE_CARD),
                'sales_count'  => (int) $p['sales_count'],
                'min_buy'      => (int) $p['min_buy'],
                'max_buy'      => (int) $p['max_buy'],
                'purchase_notice' => $p['purchase_notice'] ?? null,
                'show_stock_type' => (int) ($p['show_stock_type'] ?? 0),
            ];
        }, $products);

        // 在售商品按分类计数(含无分类的归 0,不影响分类列表)
        $countByCat = [];
        foreach ($products as $p) {
            $cid = $p['category_id'];
            if ($cid !== null) {
                $countByCat[$cid] = ($countByCat[$cid] ?? 0) + 1;
            }
        }

        // 全部显示中的分类(即便在售数为 0 也返回)
        $categories = Category::where('merchant_id', $m->id)
            ->where('status', Category::STATUS_SHOWN)
            ->order('sort', 'asc')->order('id', 'asc')
            ->field(['id', 'name', 'image'])
            ->select()
            ->toArray();

        $categories = array_map(static function ($c) use ($countByCat) {
            return [
                'id'          => (int) $c['id'],
                'name'        => $c['name'],
                'image'       => $c['image'],
                'goods_count' => (int) ($countByCat[(int) $c['id']] ?? 0),
            ];
        }, $categories);

        // 平台公告(仅显示中,按 sort 倒序,最多若干条)
        $notices = Announcement::where('status', Announcement::STATUS_SHOWN)
            ->order('sort', 'desc')->order('id', 'desc')
            ->limit(Announcement::STORE_LIMIT)
            ->field(['id', 'title', 'content', 'create_time'])
            ->select()
            ->toArray();

        $notices = array_map(static function ($n) {
            return [
                'id'          => (int) $n['id'],
                'title'       => $n['title'],
                'content'     => $n['content'],
                'create_time' => $n['create_time'],
            ];
        }, $notices);

        return [
            'store'      => [
                'name'         => $m->store_name,
                'slug'         => $m->store_slug,
                'logo'         => $m->logo,
                'cover'        => $m->cover,
                'intro'        => $m->intro,
                'announcement' => $m->announcement,
                'verified'     => (int) $m->verified,
                'deposit'      => $m->deposit,
                'sales_count'  => (int) $m->sales_count,
                'contact'      => [
                    'qq'     => $m->contact_qq,
                    'wechat' => $m->contact_wechat,
                    'mobile' => $m->contact_mobile,
                ],
            ],
            'categories' => $categories,
            'products'   => $products,
            'notices'    => $notices,
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
            'market_price'     => $p->market_price,
            'image'            => $p->image,
            'goods_type'       => (int) ($p->goods_type ?? Product::GOODS_TYPE_CARD),
            'description'      => $p->description,
            'stock'            => (int) $p->stock,
            'sales_count'      => (int) $p->sales_count,
            'min_buy'          => (int) $p->min_buy,
            'max_buy'          => (int) $p->max_buy,
            'delivery_message' => $p->delivery_message,
            'purchase_notice'  => $p->purchase_notice,
            'show_stock_type'  => (int) $p->show_stock_type,
        ];
    }
}
