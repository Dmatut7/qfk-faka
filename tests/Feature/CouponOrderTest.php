<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Coupon;
use app\model\Merchant;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;
use think\facade\Db;

/**
 * 优惠券增量2(关键路径):下单应用券 + 订单金额分解 + 支付/结算按应付 + 核销。
 * 严守:无券订单口径不变;一卡一售/结算不回归。
 */
class CouponOrderTest extends TestCase
{
    private const KEY = 'secretkey';

    private Merchant $m;
    private Product $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant(['commission_rate' => '0.1000']);
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '75.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 3; $i++) {
            $s = 'CO-' . $this->p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => 3]);
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);
    }

    private function coupon(array $o = []): Coupon
    {
        return Coupon::create(array_merge([
            'merchant_id' => $this->m->id, 'code' => 'CUT20', 'type' => Coupon::TYPE_AMOUNT,
            'value' => '20.00', 'min_amount' => '100.00', 'total' => 10, 'used' => 0, 'status' => Coupon::STATUS_ON,
        ], $o));
    }

    private function payNotify(Order $order): string
    {
        $payment = Payment::create([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id,
            'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => $order->total_amount, 'status' => Payment::STATUS_PENDING,
        ]);
        $params = [
            'pid' => '1001', 'out_trade_no' => $payment->payment_no, 'trade_no' => 'CH_' . uniqid(),
            'money' => (string) $order->total_amount, 'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
        ];
        unset($params['sign'], $params['sign_type']);
        $f = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($f);
        $parts = [];
        foreach ($f as $k => $v) { $parts[] = $k . '=' . $v; }
        $params['sign'] = md5(implode('&', $parts) . self::KEY);
        $params['sign_type'] = 'MD5';
        return $this->call('GET', '/pay/notify/epay', $params)->getContent();
    }

    public function testOrderAppliesAmountCoupon(): void
    {
        $c = $this->coupon();
        // 2 件 × 75 = 150 原价;满100减20 → 应付 130
        $order = (new OrderService())->create([
            'product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com', 'coupon_code' => $c->code,
        ]);
        $this->assertSame('150.00', Money::add((string) $order->original_amount, '0'));
        $this->assertSame('20.00', Money::add((string) $order->discount_amount, '0'));
        $this->assertSame('130.00', Money::add((string) $order->total_amount, '0')); // total=应付
        $this->assertSame((int) $c->id, (int) $order->coupon_id);
        $this->assertSame($c->code, $order->coupon_code);
        // B2「下单即占额」:下单时即占用 1 张券额(支付成功结算不再二次自增)
        $this->assertSame(1, (int) Coupon::find($c->id)->used);
        $this->payNotify($order);
        $this->assertSame(1, (int) Coupon::find($c->id)->used, '结算不再二次核销');
    }

    /** 限量券(total=1)真限量:第一单占额成功后,第二单下单即被拒(不再"先放行后封顶")。 */
    public function testLimitedCouponHardLimitRejectsSecondOrder(): void
    {
        $c = $this->coupon(['code' => 'LIMIT1', 'total' => 1, 'min_amount' => '0.00', 'value' => '5.00']);
        $svc = new OrderService();
        $o1 = $svc->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'a@x.com', 'coupon_code' => $c->code]);
        $this->assertSame((int) $c->id, (int) $o1->coupon_id);
        $this->assertSame(1, (int) Coupon::find($c->id)->used, '第一单已占满 total=1');
        // 第二单下单即被拒(券已领完),且 used 不被顶破
        try {
            $svc->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com', 'coupon_code' => $c->code]);
            $this->fail('限量券已领完,第二单应被拒');
        } catch (BizException $e) {
            $this->assertSame(Code::PARAM_ERROR, $e->getBizCode());
        }
        $this->assertSame(1, (int) Coupon::find($c->id)->used);
    }

    /** 未付款关单(超时回收)释放占用的券额,名额可再被他人使用。 */
    public function testUnpaidCloseReleasesCouponSlot(): void
    {
        $c = $this->coupon(['code' => 'REL1', 'total' => 1, 'min_amount' => '0.00', 'value' => '5.00']);
        $svc = new OrderService();
        $o1 = $svc->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'a@x.com', 'coupon_code' => $c->code]);
        $this->assertSame(1, (int) Coupon::find($c->id)->used);
        // 人为过期后回收 → 释放券额
        Order::where('id', $o1->id)->update(['expire_at' => date('Y-m-d H:i:s', time() - 60)]);
        $svc->reclaimExpired();
        $this->assertSame(Order::STATUS_CLOSED, (int) Order::find($o1->id)->status);
        $this->assertSame(0, (int) Coupon::find($c->id)->used, '关单释放券额');
        // 名额已释放,新单可再用
        $o2 = $svc->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com', 'coupon_code' => $c->code]);
        $this->assertSame((int) $c->id, (int) $o2->coupon_id);
    }

    public function testOrderWithoutCouponUnchanged(): void
    {
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $this->assertSame('75.00', Money::add((string) $order->total_amount, '0'));
        $this->assertSame('75.00', Money::add((string) $order->original_amount, '0'));
        $this->assertSame('0.00', Money::add((string) $order->discount_amount, '0'));
        $this->assertNull($order->coupon_id);
    }

    public function testInvalidCouponRejectsOrder(): void
    {
        // 门槛未达:1 件 75 < 满100
        try {
            (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com', 'coupon_code' => $this->coupon()->code]);
            $this->fail('门槛未达应拒绝下单');
        } catch (BizException $e) {
            $this->assertSame(Code::PARAM_ERROR, $e->getBizCode());
        }
    }

    public function testCouponRedeemedAndSettledOnFinalAmount(): void
    {
        $c = $this->coupon();
        $order = (new OrderService())->create([
            'product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com', 'coupon_code' => $c->code,
        ]);
        $ack = $this->payNotify($order);
        $this->assertSame('success', $ack);

        // 发货 + 核销 + 结算(按应付130;抽佣10% → 净117)
        $this->assertSame(Order::STATUS_DELIVERED, (int) Order::find($order->id)->status);
        $this->assertSame(1, (int) Coupon::find($c->id)->used);
        $this->assertSame('117.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
    }
}
