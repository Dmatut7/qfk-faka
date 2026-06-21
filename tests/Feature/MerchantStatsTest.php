<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Order;
use app\model\Product;
use app\util\OrderNo;
use tests\TestCase;
use think\facade\Db;

/**
 * 商户统计 (T7.3):销售额/订单数仅计已支付+已发货,热销商品。
 */
class MerchantStatsTest extends TestCase
{
    private function mkOrder(int $merchantId, int $productId, string $total, int $status, int $qty = 1): void
    {
        $o = Order::create([
            'order_no' => OrderNo::generate(), 'merchant_id' => $merchantId, 'product_id' => $productId,
            'buyer_email' => 'b@x.com', 'quantity' => $qty, 'unit_price' => $total, 'total_amount' => $total,
            'status' => $status, 'expire_at' => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    public function testSummaryCountsOnlyPaidAndDelivered(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '1.00']);
        $this->mkOrder($m->id, $p->id, '10.00', Order::STATUS_PAID);
        $this->mkOrder($m->id, $p->id, '20.00', Order::STATUS_DELIVERED);
        $this->mkOrder($m->id, $p->id, '5.00', Order::STATUS_PENDING);   // 排除
        $this->mkOrder($m->id, $p->id, '3.00', Order::STATUS_CLOSED);    // 排除
        $this->mkOrder($m->id, $p->id, '7.00', Order::STATUS_REFUNDED);  // 排除

        $body = $this->callJson('GET', '/merchant/stats/summary', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame('30.00', $body['data']['sales']);
        $this->assertSame(2, $body['data']['order_count']);
    }

    public function testSummaryOnlyOwnMerchant(): void
    {
        $a = $this->makeMerchant();
        $b = $this->makeMerchant();
        $pa = Product::create(['merchant_id' => $a->id, 'title' => 'a', 'price' => '1.00']);
        $pb = Product::create(['merchant_id' => $b->id, 'title' => 'b', 'price' => '1.00']);
        $this->mkOrder($a->id, $pa->id, '10.00', Order::STATUS_PAID);
        $this->mkOrder($b->id, $pb->id, '99.00', Order::STATUS_PAID);

        $body = $this->callJson('GET', '/merchant/stats/summary', [], $this->bearer($this->merchantToken((int) $a->id)));
        $this->assertSame('10.00', $body['data']['sales']);
        $this->assertSame(1, $body['data']['order_count']);
    }

    public function testTopProductsRanked(): void
    {
        $m = $this->makeMerchant();
        $hot = Product::create(['merchant_id' => $m->id, 'title' => '热销', 'price' => '1.00']);
        $cold = Product::create(['merchant_id' => $m->id, 'title' => '冷门', 'price' => '1.00']);
        // hot: 3 单共 5 件;cold: 1 单 1 件
        $this->mkOrder($m->id, $hot->id, '10.00', Order::STATUS_PAID, 2);
        $this->mkOrder($m->id, $hot->id, '10.00', Order::STATUS_DELIVERED, 2);
        $this->mkOrder($m->id, $hot->id, '5.00', Order::STATUS_PAID, 1);
        $this->mkOrder($m->id, $cold->id, '5.00', Order::STATUS_PAID, 1);

        $body = $this->callJson('GET', '/merchant/stats/top-products', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame((int) $hot->id, (int) $body['data'][0]['product_id']);
        $this->assertSame(5, (int) $body['data'][0]['qty']);
        $this->assertSame(3, (int) $body['data'][0]['order_count']);
        // join products 取标题
        $this->assertSame('热销', $body['data'][0]['product_title']);
        $this->assertSame('冷门', $body['data'][1]['product_title']);
    }

    public function testSummaryTodayYesterdayDimensions(): void
    {
        $m = $this->makeMerchant();
        $other = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '1.00']);
        $po = Product::create(['merchant_id' => $other->id, 'title' => 'o', 'price' => '1.00']);

        // 今日:DELIVERED 12.00 + DELIVERED 8.00 = sales_today 20.00;另有 PAID 5.00(计入 orders_today 不计 sales_today)
        $this->mkOrder($m->id, $p->id, '12.00', Order::STATUS_DELIVERED);
        $this->mkOrder($m->id, $p->id, '8.00', Order::STATUS_DELIVERED);
        $this->mkOrder($m->id, $p->id, '5.00', Order::STATUS_PAID);
        // 今日:PENDING 不计入 orders_today/sales_today
        $this->mkOrder($m->id, $p->id, '3.00', Order::STATUS_PENDING);
        // 今日:别的商户,完全排除
        $this->mkOrder($other->id, $po->id, '99.00', Order::STATUS_DELIVERED);

        // 昨日:DELIVERED 30.00(sales_yesterday)+ PAID 4.00(orders_yesterday)
        $this->mkOrder($m->id, $p->id, '30.00', Order::STATUS_DELIVERED);
        $this->mkOrder($m->id, $p->id, '4.00', Order::STATUS_PAID);
        $yesterday = date('Y-m-d 12:00:00', strtotime('-1 day'));
        Db::name('orders')->where('merchant_id', $m->id)
            ->whereIn('total_amount', ['30.00', '4.00'])
            ->update(['create_time' => $yesterday]);

        // 前日:DELIVERED 77.00 —— 既不在今日也不在昨日,全排除
        $this->mkOrder($m->id, $p->id, '77.00', Order::STATUS_DELIVERED);
        Db::name('orders')->where('merchant_id', $m->id)->where('total_amount', '77.00')
            ->update(['create_time' => date('Y-m-d H:i:s', time() - 86400 * 2)]);

        $body = $this->callJson('GET', '/merchant/stats/summary', [], $this->bearer($this->merchantToken((int) $m->id)));

        // 今日:已发货 12+8=20;订单数(已支付+已发货)= 2 DELIVERED + 1 PAID = 3
        $this->assertSame('20.00', $body['data']['sales_today']);
        $this->assertSame(3, $body['data']['orders_today']);
        // 昨日:已发货 30;订单数 = 1 DELIVERED + 1 PAID = 2
        $this->assertSame('30.00', $body['data']['sales_yesterday']);
        $this->assertSame(2, $body['data']['orders_yesterday']);

        // 现有累计字段保持不变:已支付+已发货 total_amount 合计 / 订单数(含前日 77,排除 PENDING)
        // sales = 12+8+5+30+4+77 = 136.00;order_count = 6
        $this->assertSame('136.00', $body['data']['sales']);
        $this->assertSame(6, $body['data']['order_count']);
    }

    public function testDateRangeHalfOpen(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '1.00']);
        $this->mkOrder($m->id, $p->id, '10.00', Order::STATUS_PAID);
        // 把一单挪到昨天
        $old = Order::where('merchant_id', $m->id)->find();
        Db::name('orders')->where('id', $old->id)->update(['create_time' => date('Y-m-d H:i:s', time() - 86400 * 2)]);
        $this->mkOrder($m->id, $p->id, '20.00', Order::STATUS_PAID); // 今天

        $todayStart = date('Y-m-d 00:00:00');
        $body = $this->callJson('GET', '/merchant/stats/summary', ['start' => $todayStart], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame('20.00', $body['data']['sales'], '仅统计区间内订单');
        $this->assertSame(1, $body['data']['order_count']);
    }
}
