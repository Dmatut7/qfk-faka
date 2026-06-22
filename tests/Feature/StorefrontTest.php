<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Merchant;
use app\model\Product;
use tests\TestCase;

/**
 * 买家前台商店/商品浏览 (T5.1)。
 */
class StorefrontTest extends TestCase
{
    public function testStoreListsOnlyOnSaleProducts(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'myshop_' . uniqid()]);
        Product::create(['merchant_id' => $m->id, 'title' => '在售', 'price' => '9.90', 'status' => Product::STATUS_ON, 'stock' => 5]);
        Product::create(['merchant_id' => $m->id, 'title' => '下架', 'price' => '1.00', 'status' => Product::STATUS_OFF]);

        $body = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame(0, $body['code']);
        $this->assertSame($m->store_name, $body['data']['store']['name']);
        $this->assertCount(1, $body['data']['products']);
        $this->assertSame('在售', $body['data']['products'][0]['title']);
        $this->assertSame(5, $body['data']['products'][0]['stock']);
    }

    public function testUnknownStore404(): void
    {
        $this->assertSame(404, $this->call('GET', '/s/no_such_shop_xyz')->getCode());
    }

    public function testGoodsTypeExposedInListAndDetail(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'gt_' . uniqid()]);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '知识商品', 'price' => '9.90', 'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE]);

        $store = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame(Product::GOODS_TYPE_KNOWLEDGE, (int) $store['data']['products'][0]['goods_type']);

        $detail = $this->callJson('GET', '/buyer/product/' . $p->id);
        $this->assertSame(Product::GOODS_TYPE_KNOWLEDGE, (int) $detail['data']['goods_type']);
    }

    public function testFrozenMerchantStoreHidden(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'frozen_' . uniqid(), 'status' => Merchant::STATUS_FROZEN]);
        $this->assertSame(404, $this->call('GET', '/s/' . $m->store_slug)->getCode());
    }

    public function testProductDetailOnSale(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => '详情', 'price' => '12.00', 'status' => Product::STATUS_ON, 'min_buy' => 1, 'max_buy' => 10]);

        $body = $this->callJson('GET', '/buyer/product/' . $p->id);
        $this->assertSame(0, $body['code']);
        $this->assertSame('详情', $body['data']['title']);
        $this->assertSame('12.00', $body['data']['price']);
        $this->assertSame(10, $body['data']['max_buy']);
    }

    public function testOffSaleProductDetailRejected(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'x', 'price' => '1.00', 'status' => Product::STATUS_OFF]);
        $body = $this->callJson('GET', '/buyer/product/' . $p->id);
        $this->assertSame(Code::PRODUCT_OFF, $body['code']);
    }

    /**
     * 商品带购买须知/库存显示方式创建后,/s/{slug} 与 /buyer/product/{id} 均能返回这两字段。
     */
    public function testPurchaseNoticeAndShowStockTypeExposed(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'notice_' . uniqid()]);
        $token = $this->merchantToken((int) $m->id);

        $r = $this->callJson('POST', '/merchant/products', [
            'title'           => '须知商品',
            'price'           => '8.80',
            'purchase_notice' => '下单前请阅读须知',
            'show_stock_type' => 1,
        ], $this->bearer($token));
        $this->assertSame(0, $r['code']);
        $this->assertSame('下单前请阅读须知', $r['data']['purchase_notice']);
        $this->assertSame(1, (int) $r['data']['show_stock_type']);
        $pid = (int) $r['data']['id'];

        // /s/{slug} 列表返回
        $store = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame(0, $store['code']);
        $found = null;
        foreach ($store['data']['products'] as $row) {
            if ((int) $row['id'] === $pid) {
                $found = $row;
                break;
            }
        }
        $this->assertNotNull($found, '新建商品应出现在店铺列表');
        $this->assertSame('下单前请阅读须知', $found['purchase_notice']);
        $this->assertSame(1, $found['show_stock_type']);

        // /buyer/product/{id} 详情返回
        $detail = $this->callJson('GET', '/buyer/product/' . $pid);
        $this->assertSame(0, $detail['code']);
        $this->assertSame('下单前请阅读须知', $detail['data']['purchase_notice']);
        $this->assertSame(1, $detail['data']['show_stock_type']);
    }
}
