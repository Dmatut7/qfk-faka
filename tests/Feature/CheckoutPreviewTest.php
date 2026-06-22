<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Coupon;
use app\model\Merchant;
use app\model\Product;
use app\model\Promotion;
use tests\TestCase;

/**
 * 结算试算 /buyer/checkout/preview:原价(含限时折扣)+ 最优优惠(券/满减满折互斥取最优)+ 应付。
 */
class CheckoutPreviewTest extends TestCase
{
    private Merchant $m;
    private Product $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '100.00', 'status' => Product::STATUS_ON]);
    }

    private function preview(array $body): array
    {
        return $this->callJson('POST', '/buyer/checkout/preview', $body);
    }

    public function testPreviewShowsAutoPromotionWithoutCoupon(): void
    {
        Promotion::create(['merchant_id' => $this->m->id, 'type' => Promotion::TYPE_FULL_REDUCE, 'threshold' => '150.00', 'value' => '25.00', 'status' => 1]);
        // 2 件 200 → 满150减25,应付175(无需填券)
        $r = $this->preview(['product_id' => $this->p->id, 'quantity' => 2]);
        $this->assertSame(0, $r['code']);
        $this->assertSame('200.00', $r['data']['original_amount']);
        $this->assertSame('25.00', $r['data']['discount']);
        $this->assertSame('175.00', $r['data']['final_amount']);
        $this->assertSame('满减', $r['data']['discount_label']);
        $this->assertFalse($r['data']['coupon_applied']);
    }

    public function testPreviewTakesBetterOfCouponVsPromotion(): void
    {
        Promotion::create(['merchant_id' => $this->m->id, 'type' => Promotion::TYPE_FULL_REDUCE, 'threshold' => '100.00', 'value' => '10.00', 'status' => 1]);
        Coupon::create(['merchant_id' => $this->m->id, 'code' => 'C40', 'type' => Coupon::TYPE_AMOUNT, 'value' => '40.00', 'min_amount' => '0.00', 'total' => 10, 'used' => 0, 'status' => Coupon::STATUS_ON]);

        // 1 件 100:券减40 > 促销减10 → 应付60,coupon_applied
        $r = $this->preview(['product_id' => $this->p->id, 'quantity' => 1, 'coupon_code' => 'C40']);
        $this->assertSame('40.00', $r['data']['discount']);
        $this->assertSame('60.00', $r['data']['final_amount']);
        $this->assertTrue($r['data']['coupon_applied']);
    }

    public function testPreviewReflectsTimedDiscountPrice(): void
    {
        Product::where('id', $this->p->id)->update([
            'discount_price' => '80.00',
            'discount_start' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'discount_end'   => date('Y-m-d H:i:s', strtotime('+1 hour')),
        ]);
        // 限时折扣价80 → 原价口径=80(应收价)
        $r = $this->preview(['product_id' => $this->p->id, 'quantity' => 1]);
        $this->assertSame('80.00', $r['data']['original_amount']);
        $this->assertSame('80.00', $r['data']['final_amount']);
    }

    public function testPreviewNoAuthRequired(): void
    {
        $this->assertSame(200, $this->call('POST', '/buyer/checkout/preview', ['product_id' => $this->p->id, 'quantity' => 1])->getCode());
    }
}
