<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Coupon;
use app\model\Product;
use tests\TestCase;

/**
 * 优惠券增量1:商户 CRUD + 计价校验(满减/折扣/封顶/防0元/有效期/库存)。
 * 纯计价,不触下单结算(增量2)。金额走 bcmath,断言两位小数字符串。
 */
class CouponTest extends TestCase
{
    private function coupon(int $merchantId, array $o = []): Coupon
    {
        return Coupon::create(array_merge([
            'merchant_id' => $merchantId,
            'code'        => 'C' . strtoupper(substr(uniqid(), -8)),
            'name'        => '券',
            'type'        => Coupon::TYPE_AMOUNT,
            'value'       => '20.00',
            'min_amount'  => '100.00',
            'max_discount' => '0.00',
            'total'       => 0,
            'used'        => 0,
            'status'      => Coupon::STATUS_ON,
        ], $o));
    }

    private function product(int $merchantId, string $price): Product
    {
        return Product::create(['merchant_id' => $merchantId, 'title' => 'p', 'price' => $price, 'status' => Product::STATUS_ON]);
    }

    private function validate(int $productId, string $code, int $qty = 1): array
    {
        return $this->callJson('POST', '/buyer/coupon/validate', ['code' => $code, 'product_id' => $productId, 'quantity' => $qty]);
    }

    // ===== 商户 CRUD =====
    public function testMerchantCreateCoupon(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/merchant/coupons', [
            'code' => 'SAVE20', 'name' => '满100减20', 'type' => Coupon::TYPE_AMOUNT,
            'value' => '20.00', 'min_amount' => '100.00', 'total' => 50,
        ], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(0, $r['code']);
        $c = Coupon::find($r['data']['id']);
        $this->assertSame('SAVE20', $c->code);
        $this->assertSame((int) $m->id, (int) $c->merchant_id);
    }

    /** L24:生效时间晚于失效时间的券必须被拒(否则是永不可用/口径错乱的窗口) */
    public function testRejectsInvertedValidWindow(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        $r = $this->callJson('POST', '/merchant/coupons', [
            'code' => 'WIN' . substr(uniqid(), -6), 'value' => '5.00',
            'valid_from' => date('Y-m-d H:i:s', strtotime('+2 day')),
            'valid_to'   => date('Y-m-d H:i:s', strtotime('+1 day')),
        ], $tok);
        $this->assertSame(Code::PARAM_ERROR, $r['code'], '生效晚于失效的券必须被拒');
    }

    public function testMerchantCannotDuplicateCode(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        $this->callJson('POST', '/merchant/coupons', ['code' => 'DUP', 'value' => '5.00'], $tok);
        $r2 = $this->callJson('POST', '/merchant/coupons', ['code' => 'DUP', 'value' => '6.00'], $tok);
        $this->assertNotSame(0, $r2['code']); // 同商户券码重复被拒
    }

    public function testPercentCouponValueRangeValidated(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        // 折扣券 value 必须在 (0,100):0 / 100 / >100 全部拒绝(防 value=0 算出近乎0元单)
        foreach (['0', '0.00', '100', '150'] as $bad) {
            $r = $this->callJson('POST', '/merchant/coupons', [
                'code' => 'PCT' . substr(uniqid(), -6), 'type' => Coupon::TYPE_PERCENT, 'value' => $bad,
            ], $tok);
            $this->assertSame(Code::PARAM_ERROR, $r['code'], "折扣 value={$bad} 应被拒");
        }
        // 合法折扣 90(九折)通过
        $ok = $this->callJson('POST', '/merchant/coupons', [
            'code' => 'PCTOK', 'type' => Coupon::TYPE_PERCENT, 'value' => '90',
        ], $tok);
        $this->assertSame(0, $ok['code']);
    }

    public function testAmountCouponValueMustBePositive(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        $r = $this->callJson('POST', '/merchant/coupons', [
            'code' => 'AMT0', 'type' => Coupon::TYPE_AMOUNT, 'value' => '0',
        ], $tok);
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }

    // ===== 满减 =====
    public function testAmountCouponDiscount(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '75.00');
        $c = $this->coupon((int) $m->id, ['type' => Coupon::TYPE_AMOUNT, 'value' => '20.00', 'min_amount' => '100.00']);

        // 1 件 75 < 门槛100 → 不可用
        $r1 = $this->validate((int) $p->id, $c->code, 1);
        $this->assertSame(Code::PARAM_ERROR, $r1['code']);

        // 2 件 150 ≥ 100 → 减 20,应付 130
        $r2 = $this->validate((int) $p->id, $c->code, 2);
        $this->assertSame(0, $r2['code']);
        $this->assertSame('150.00', $r2['data']['original_amount']);
        $this->assertSame('20.00', $r2['data']['discount']);
        $this->assertSame('130.00', $r2['data']['final_amount']);
    }

    // ===== 折扣 =====
    public function testPercentCouponDiscount(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '100.00');
        $c = $this->coupon((int) $m->id, ['type' => Coupon::TYPE_PERCENT, 'value' => '90.00', 'min_amount' => '0.00']);

        // 九折:应付 90,优惠 10
        $r = $this->validate((int) $p->id, $c->code, 1);
        $this->assertSame(0, $r['code']);
        $this->assertSame('10.00', $r['data']['discount']);
        $this->assertSame('90.00', $r['data']['final_amount']);
    }

    public function testPercentCouponCappedByMaxDiscount(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '100.00');
        // 九折本应减 10,但封顶 5 → 优惠 5,应付 95
        $c = $this->coupon((int) $m->id, ['type' => Coupon::TYPE_PERCENT, 'value' => '90.00', 'min_amount' => '0.00', 'max_discount' => '5.00']);
        $r = $this->validate((int) $p->id, $c->code, 1);
        $this->assertSame('5.00', $r['data']['discount']);
        $this->assertSame('95.00', $r['data']['final_amount']);
    }

    public function testDiscountNeverZeroesOrder(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '50.00');
        // 满0减100,但订单仅50 → 优惠封到 49.99,应付 0.01(防0元单)
        $c = $this->coupon((int) $m->id, ['type' => Coupon::TYPE_AMOUNT, 'value' => '100.00', 'min_amount' => '0.00']);
        $r = $this->validate((int) $p->id, $c->code, 1);
        $this->assertSame(0, $r['code']);
        $this->assertSame('49.99', $r['data']['discount']);
        $this->assertSame('0.01', $r['data']['final_amount']);
    }

    public function testValidateUsesTimedDiscountPrice(): void
    {
        // 商品 100,限时折扣价 60 生效 → 券试算原价应按 60(与下单/preview 同口径)
        $m = $this->makeMerchant();
        $p = Product::create([
            'merchant_id' => $m->id, 'title' => 'p', 'price' => '100.00', 'status' => Product::STATUS_ON,
            'discount_price' => '60.00', 'discount_start' => date('Y-m-d H:i:s', strtotime('-1 hour')), 'discount_end' => date('Y-m-d H:i:s', strtotime('+1 hour')),
        ]);
        $c = $this->coupon((int) $m->id, ['type' => Coupon::TYPE_AMOUNT, 'value' => '10.00', 'min_amount' => '0.00']);
        $r = $this->validate((int) $p->id, $c->code, 1);
        $this->assertSame(0, $r['code']);
        $this->assertSame('60.00', $r['data']['original_amount']); // 折后价,非 100
        $this->assertSame('50.00', $r['data']['final_amount']);    // 60 - 10
    }

    // ===== 不可用情形 =====
    public function testExpiredCouponRejected(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '200.00');
        $c = $this->coupon((int) $m->id, ['valid_to' => date('Y-m-d H:i:s', strtotime('-1 day'))]);
        $this->assertSame(Code::PARAM_ERROR, $this->validate((int) $p->id, $c->code, 1)['code']);
    }

    public function testDisabledCouponRejected(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '200.00');
        $c = $this->coupon((int) $m->id, ['status' => Coupon::STATUS_OFF]);
        $this->assertSame(Code::PARAM_ERROR, $this->validate((int) $p->id, $c->code, 1)['code']);
    }

    public function testSoldOutCouponRejected(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '200.00');
        $c = $this->coupon((int) $m->id, ['total' => 5, 'used' => 5]);
        $this->assertSame(Code::PARAM_ERROR, $this->validate((int) $p->id, $c->code, 1)['code']);
    }

    public function testUnknownCodeRejected(): void
    {
        $m = $this->makeMerchant();
        $p = $this->product((int) $m->id, '200.00');
        $this->assertSame(Code::PARAM_ERROR, $this->validate((int) $p->id, 'NOPE', 1)['code']);
    }

    public function testCouponOfOtherMerchantRejected(): void
    {
        $m = $this->makeMerchant();
        $other = $this->makeMerchant();
        $p = $this->product((int) $m->id, '200.00');
        // 券属于 other,但商品属于 m → 不可用(券作用域限本商户)
        $c = $this->coupon((int) $other->id);
        $this->assertSame(Code::PARAM_ERROR, $this->validate((int) $p->id, $c->code, 1)['code']);
    }
}
