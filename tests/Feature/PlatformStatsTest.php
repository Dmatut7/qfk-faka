<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 门户公开平台统计 /index/platformStats:非敏感计数,免鉴权。
 */
class PlatformStatsTest extends TestCase
{
    public function testPublicStatsCountActiveMerchantsOnSaleProductsDeliveredOrders(): void
    {
        $base = $this->callJson('GET', '/index/platformStats');
        $this->assertSame(0, $base['code']);

        $m = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $this->makeMerchant(['status' => Merchant::STATUS_FROZEN]); // 冻结不计
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'p', 'price' => '5.00', 'status' => Product::STATUS_ON]);
        Product::create(['merchant_id' => $m->id, 'title' => 'off', 'price' => '5.00', 'status' => Product::STATUS_OFF]); // 下架不计
        Order::create(['order_no' => OrderNo::generate(), 'merchant_id' => $m->id, 'product_id' => $p->id, 'buyer_email' => 'b@x.com', 'quantity' => 1, 'unit_price' => '5.00', 'total_amount' => '5.00', 'status' => Order::STATUS_DELIVERED, 'expire_at' => date('Y-m-d H:i:s', time() + 900)]);
        Order::create(['order_no' => OrderNo::generate(), 'merchant_id' => $m->id, 'product_id' => $p->id, 'buyer_email' => 'b@x.com', 'quantity' => 1, 'unit_price' => '5.00', 'total_amount' => '5.00', 'status' => Order::STATUS_PENDING, 'expire_at' => date('Y-m-d H:i:s', time() + 900)]); // 待支付不计

        $r = $this->callJson('GET', '/index/platformStats');
        $this->assertSame($base['data']['merchants'] + 1, $r['data']['merchants']);
        $this->assertSame($base['data']['products'] + 1, $r['data']['products']);
        $this->assertSame($base['data']['orders'] + 1, $r['data']['orders']);
    }

    public function testNoAuthRequired(): void
    {
        $this->assertSame(200, $this->call('GET', '/index/platformStats')->getCode());
    }
}
