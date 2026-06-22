<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Product;
use app\service\OrderService;
use app\util\Money;
use tests\TestCase;

/**
 * 限时折扣(商品价格层):窗口内改单价,下单按折扣价计;过期/未到/无折扣按原价。
 */
class TimedDiscountTest extends TestCase
{
    private function product(string $price, array $o = []): Product
    {
        $m = $this->makeMerchant();
        $p = Product::create(array_merge(['merchant_id' => $m->id, 'title' => 'c', 'price' => $price, 'status' => Product::STATUS_ON, 'stock' => 0], $o));
        for ($i = 0; $i < 3; $i++) {
            $s = 'TD-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => 3]);
        return Product::find($p->id);
    }

    public function testActiveDiscountAppliesAtCheckout(): void
    {
        $past = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $future = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $p = $this->product('100.00', ['discount_price' => '80.00', 'discount_start' => $past, 'discount_end' => $future]);
        $this->assertTrue($p->discountActive());
        $this->assertSame('80.00', $p->effectivePrice());

        // 下单 2 件 → 160(按折扣价)
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        $this->assertSame('160.00', Money::add((string) $order->total_amount, '0'));
        $this->assertSame('80.00', Money::add((string) $order->unit_price, '0'));
        $this->assertSame('160.00', Money::add((string) $order->original_amount, '0'));
    }

    public function testExpiredDiscountUsesListPrice(): void
    {
        $p = $this->product('100.00', [
            'discount_price' => '80.00',
            'discount_start' => date('Y-m-d H:i:s', strtotime('-2 day')),
            'discount_end'   => date('Y-m-d H:i:s', strtotime('-1 day')),
        ]);
        $this->assertFalse($p->discountActive());
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $this->assertSame('100.00', Money::add((string) $order->total_amount, '0'));
    }

    public function testFutureDiscountNotYetActive(): void
    {
        $p = $this->product('100.00', [
            'discount_price' => '80.00',
            'discount_start' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'discount_end'   => date('Y-m-d H:i:s', strtotime('+2 day')),
        ]);
        $this->assertFalse($p->discountActive());
        $this->assertSame('100.00', $p->effectivePrice());
    }

    public function testStorefrontExposesOnSaleAndEffectivePrice(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'sale_' . uniqid()]);
        $p = Product::create([
            'merchant_id' => $m->id, 'title' => '促销品', 'price' => '50.00', 'status' => Product::STATUS_ON,
            'discount_price' => '39.90', 'discount_start' => date('Y-m-d H:i:s', strtotime('-1 hour')), 'discount_end' => date('Y-m-d H:i:s', strtotime('+1 hour')),
        ]);

        $store = $this->callJson('GET', '/s/' . $m->store_slug);
        $row = $store['data']['products'][0];
        $this->assertSame('39.90', $row['price']);          // 应收价=折扣价
        $this->assertSame('50.00', $row['original_price']); // 原价划线
        $this->assertTrue($row['on_sale']);

        $detail = $this->callJson('GET', '/buyer/product/' . $p->id);
        $this->assertSame('39.90', $detail['data']['price']);
        $this->assertTrue($detail['data']['on_sale']);
    }

    public function testMerchantRejectsDiscountNotBelowPrice(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/merchant/products', [
            'title' => 'x', 'price' => '10.00', 'discount_price' => '12.00',
        ], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }
}
