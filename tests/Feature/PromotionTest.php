<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Coupon;
use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use app\model\Promotion;
use app\service\OrderService;
use app\service\PromotionService;
use app\util\Money;
use tests\TestCase;

/**
 * 订单级促销(满减/满折):取最优引擎 + 下单与优惠券「互斥取最优」。
 */
class PromotionTest extends TestCase
{
    private Merchant $m;
    private Product $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '100.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 5; $i++) {
            $s = 'PM-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => 5]);
    }

    private function promo(int $type, string $threshold, string $value): Promotion
    {
        return Promotion::create(['merchant_id' => $this->m->id, 'type' => $type, 'threshold' => $threshold, 'value' => $value, 'status' => Promotion::STATUS_ON]);
    }

    public function testPromotionValueRangeValidatedOnCreate(): void
    {
        $svc = new PromotionService();
        // 满折 value 必须 (0,100):0/100/150 拒绝(防 value=0 把满额单清成 0.01)
        foreach (['0', '100', '150'] as $bad) {
            try {
                $svc->create((int) $this->m->id, ['type' => Promotion::TYPE_FULL_DISCOUNT, 'threshold' => '100.00', 'value' => $bad]);
                $this->fail("满折 value={$bad} 应被拒");
            } catch (\app\common\BizException $e) {
                $this->assertSame(\app\common\Code::PARAM_ERROR, $e->getBizCode());
            }
        }
        // 满减 value 必须 >0
        try {
            $svc->create((int) $this->m->id, ['type' => Promotion::TYPE_FULL_REDUCE, 'threshold' => '100.00', 'value' => '0']);
            $this->fail('满减 value=0 应被拒');
        } catch (\app\common\BizException $e) {
            $this->assertSame(\app\common\Code::PARAM_ERROR, $e->getBizCode());
        }
        // 合法满折 90 通过
        $ok = $svc->create((int) $this->m->id, ['type' => Promotion::TYPE_FULL_DISCOUNT, 'threshold' => '100.00', 'value' => '90']);
        $this->assertSame(Promotion::TYPE_FULL_DISCOUNT, (int) $ok->type);
    }

    /** L24:开始时间晚于结束时间的限时活动必须被拒 */
    public function testRejectsInvertedWindow(): void
    {
        try {
            (new PromotionService())->create((int) $this->m->id, [
                'type' => Promotion::TYPE_FULL_REDUCE, 'threshold' => '100.00', 'value' => '10',
                'start_at' => date('Y-m-d H:i:s', strtotime('+2 day')),
                'end_at'   => date('Y-m-d H:i:s', strtotime('+1 day')),
            ]);
            $this->fail('start_at 晚于 end_at 应被拒');
        } catch (\app\common\BizException $e) {
            $this->assertSame(\app\common\Code::PARAM_ERROR, $e->getBizCode());
        }
    }

    public function testBestPromotionPicksLargestApplicable(): void
    {
        $this->promo(Promotion::TYPE_FULL_REDUCE, '100.00', '10.00'); // 满100减10
        $this->promo(Promotion::TYPE_FULL_REDUCE, '200.00', '30.00'); // 满200减30(未达不算)
        $svc = new PromotionService();

        $r1 = $svc->bestPromotion((int) $this->m->id, '150.00'); // 仅满100减10
        $this->assertSame('10.00', $r1['discount']);

        $r2 = $svc->bestPromotion((int) $this->m->id, '250.00'); // 满100减10 vs 满200减30 → 取30
        $this->assertSame('30.00', $r2['discount']);

        $this->assertNull($svc->bestPromotion((int) $this->m->id, '50.00')); // 未达任何门槛
    }

    public function testFullDiscountComputation(): void
    {
        $this->promo(Promotion::TYPE_FULL_DISCOUNT, '100.00', '90.00'); // 满100打九折
        $r = (new PromotionService())->bestPromotion((int) $this->m->id, '200.00');
        $this->assertSame('20.00', $r['discount']); // 200*10%=20
        $this->assertSame('满折', $r['label']);
    }

    /** 限时活动:已过期(end_at 在过去)不参与 */
    public function testExpiredPromotionDoesNotApply(): void
    {
        Promotion::create([
            'merchant_id' => $this->m->id, 'type' => Promotion::TYPE_FULL_REDUCE,
            'threshold' => '100.00', 'value' => '10.00', 'status' => Promotion::STATUS_ON,
            'start_at' => date('Y-m-d H:i:s', strtotime('-2 day')),
            'end_at'   => date('Y-m-d H:i:s', strtotime('-1 day')),
        ]);
        $this->assertNull((new PromotionService())->bestPromotion((int) $this->m->id, '150.00'));
    }

    /** 限时活动:尚未开始(start_at 在未来)不参与 */
    public function testNotYetActivePromotionDoesNotApply(): void
    {
        Promotion::create([
            'merchant_id' => $this->m->id, 'type' => Promotion::TYPE_FULL_REDUCE,
            'threshold' => '100.00', 'value' => '10.00', 'status' => Promotion::STATUS_ON,
            'start_at' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'end_at'   => null,
        ]);
        $this->assertNull((new PromotionService())->bestPromotion((int) $this->m->id, '150.00'));
    }

    /** 限时活动:在窗口内正常参与;空端不限制 */
    public function testPromotionWithinWindowApplies(): void
    {
        Promotion::create([
            'merchant_id' => $this->m->id, 'type' => Promotion::TYPE_FULL_REDUCE,
            'threshold' => '100.00', 'value' => '10.00', 'status' => Promotion::STATUS_ON,
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'end_at'   => date('Y-m-d H:i:s', strtotime('+1 day')),
        ]);
        $r = (new PromotionService())->bestPromotion((int) $this->m->id, '150.00');
        $this->assertSame('10.00', $r['discount']);
    }

    public function testOrderAppliesPromotionAutomatically(): void
    {
        $this->promo(Promotion::TYPE_FULL_REDUCE, '150.00', '25.00'); // 满150减25
        // 2 件 × 100 = 200 ≥ 150 → 减 25,应付 175
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        $this->assertSame('200.00', Money::add((string) $order->original_amount, '0'));
        $this->assertSame('25.00', Money::add((string) $order->discount_amount, '0'));
        $this->assertSame('175.00', Money::add((string) $order->total_amount, '0'));
        $this->assertSame('满减', $order->discount_label);
        $this->assertNull($order->coupon_id);
    }

    public function testCouponBeatsPromotionWhenLarger(): void
    {
        $this->promo(Promotion::TYPE_FULL_REDUCE, '100.00', '10.00'); // 促销减10
        Coupon::create(['merchant_id' => $this->m->id, 'code' => 'BIG30', 'type' => Coupon::TYPE_AMOUNT, 'value' => '30.00', 'min_amount' => '0.00', 'total' => 10, 'used' => 0, 'status' => Coupon::STATUS_ON]);

        // 1 件 100:券减30 > 促销减10 → 用券,应付70,记 coupon
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com', 'coupon_code' => 'BIG30']);
        $this->assertSame('30.00', Money::add((string) $order->discount_amount, '0'));
        $this->assertSame('70.00', Money::add((string) $order->total_amount, '0'));
        $this->assertSame('BIG30', $order->coupon_code);
    }

    public function testPromotionBeatsSmallerCoupon(): void
    {
        $this->promo(Promotion::TYPE_FULL_REDUCE, '100.00', '40.00'); // 促销减40
        Coupon::create(['merchant_id' => $this->m->id, 'code' => 'SM5', 'type' => Coupon::TYPE_AMOUNT, 'value' => '5.00', 'min_amount' => '0.00', 'total' => 10, 'used' => 0, 'status' => Coupon::STATUS_ON]);

        // 1 件 100:促销减40 > 券减5 → 用促销,不核销券(coupon_id 空)
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com', 'coupon_code' => 'SM5']);
        $this->assertSame('40.00', Money::add((string) $order->discount_amount, '0'));
        $this->assertSame('满减', $order->discount_label);
        $this->assertNull($order->coupon_id);
        $this->assertSame(0, (int) Coupon::where('code', 'SM5')->find()->used); // 券未被核销
    }

    public function testMerchantCrudEndpoint(): void
    {
        $tok = $this->bearer($this->merchantToken((int) $this->m->id));
        $r = $this->callJson('POST', '/merchant/promotions', ['name' => '满减活动', 'type' => 1, 'threshold' => '100', 'value' => '10'], $tok);
        $this->assertSame(0, $r['code']);
        $this->assertSame((int) $this->m->id, (int) Promotion::find($r['data']['id'])->merchant_id);
        $list = $this->callJson('GET', '/merchant/promotions', [], $tok);
        $this->assertCount(1, $list['data']['items']);
    }
}
