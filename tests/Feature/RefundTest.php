<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Coupon;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use app\service\RefundService;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 售后退款闭环(关键路径):退款 = 状态置退款 + 卡密回库 + 反向资金流水 + 优惠券反核销。
 * 反向严格依据该订单实际产生的结算流水(兼容未结算的异常单)。
 */
class RefundTest extends TestCase
{
    private const KEY = 'secretkey';

    private Merchant $m;
    private Product $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant(['commission_rate' => '0.1000', 'balance' => '0.00']);
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 2; $i++) {
            $s = 'RF-' . $this->p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => 2]);
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);
    }

    /** 下单并支付成功(走真实回调结算/发货),返回订单 */
    private function paidOrder(array $input): Order
    {
        $order   = (new OrderService())->create($input);
        $payment = Payment::create([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id,
            'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => $order->total_amount, 'status' => Payment::STATUS_PENDING,
        ]);
        $params = [
            'pid' => '1001', 'out_trade_no' => $payment->payment_no, 'trade_no' => 'CH_' . uniqid(),
            'money' => (string) $order->total_amount, 'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
        ];
        $f = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($f);
        $parts = [];
        foreach ($f as $k => $v) { $parts[] = $k . '=' . $v; }
        $params['sign'] = md5(implode('&', $parts) . self::KEY);
        $params['sign_type'] = 'MD5';
        $this->call('GET', '/pay/notify/epay', $params);
        return Order::find($order->id);
    }

    public function testRefundDeliveredCardOrderReversesAll(): void
    {
        // 下单2件=20,支付结算:余额 +18(净),佣金 -2
        $order = $this->paidOrder(['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        $this->assertSame(Order::STATUS_DELIVERED, (int) $order->status);
        $this->assertSame('18.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
        $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->count());

        (new RefundService())->refund((int) $order->id, '测试退款');

        // 订单退款、资金冲回 0;但已交付(SOLD)卡密**不可回收**(spec §10.5):
        // 置作废终态、保留 order_id 归属、不回 UNSOLD、不回补库存——杜绝同一卡密二次售卖。
        $this->assertSame(Order::STATUS_REFUNDED, (int) Order::find($order->id)->status);
        $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_DISABLED)->count());
        $this->assertSame(0, Card::where('product_id', $this->p->id)->where('status', Card::STATUS_UNSOLD)->count(), '已交付卡密不得回库重售');
        $this->assertSame(0, (int) Product::find($this->p->id)->stock, '已交付卡密退款不回补库存');
        $this->assertSame('0.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
        // 反向流水:退款冲收入 -20、佣金回冲 +2
        $this->assertSame(1, MerchantFundLog::where('order_id', $order->id)->where('type', MerchantFundLog::TYPE_REFUND)->count());
    }

    /** LOCKED(尚未交付,如卡不足异常单)卡密退款可回库重售;与已交付 SOLD 区分对待。 */
    public function testRefundReleasesLockedButDisablesSoldCards(): void
    {
        // 构造:一单 2 件,人工把卡置成 1 张 LOCKED(未交付) + 1 张 SOLD(已交付)
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        $cards = Card::where('order_id', $order->id)->select();
        $cards[0]->save(['status' => Card::STATUS_LOCKED]);
        $cards[1]->save(['status' => Card::STATUS_SOLD]);
        // 该单未结算(无 income 流水),退款只处理卡密
        Order::where('id', $order->id)->update(['status' => Order::STATUS_EXCEPTION]);

        (new RefundService())->refund((int) $order->id);

        // LOCKED 回 UNSOLD;SOLD 作废;库存仅对 LOCKED 那张回补
        $this->assertSame(1, Card::where('product_id', $this->p->id)->where('status', Card::STATUS_UNSOLD)->count());
        $this->assertSame(1, Card::where('order_id', $order->id)->where('status', Card::STATUS_DISABLED)->count());
    }

    public function testRefundNonCardOrder(): void
    {
        $np = Product::create(['merchant_id' => $this->m->id, 'title' => '资源', 'price' => '30.00', 'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_RESOURCE, 'delivery_message' => 'link', 'stock' => 0]);
        $order = $this->paidOrder(['product_id' => $np->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']); // 30 → 净27
        $this->assertSame('27.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));

        (new RefundService())->refund((int) $order->id);
        $this->assertSame(Order::STATUS_REFUNDED, (int) Order::find($order->id)->status);
        $this->assertSame('0.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
        $this->assertSame(0, Card::where('order_id', $order->id)->count());
    }

    public function testRefundCouponOrderRestoresCouponUse(): void
    {
        $c = Coupon::create(['merchant_id' => $this->m->id, 'code' => 'R10', 'type' => Coupon::TYPE_AMOUNT, 'value' => '5.00', 'min_amount' => '0.00', 'total' => 10, 'used' => 0, 'status' => Coupon::STATUS_ON]);
        $order = $this->paidOrder(['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com', 'coupon_code' => 'R10']); // 20-5=15
        $this->assertSame(1, (int) Coupon::find($c->id)->used); // 已核销

        (new RefundService())->refund((int) $order->id);
        $this->assertSame(0, (int) Coupon::find($c->id)->used); // 反核销
    }

    public function testCannotRefundPendingOrder(): void
    {
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        try {
            (new RefundService())->refund((int) $order->id);
            $this->fail('待支付订单不可退款');
        } catch (BizException $e) {
            $this->assertSame(Code::STATE_INVALID, $e->getBizCode());
        }
    }

    public function testCannotRefundTwice(): void
    {
        $order = $this->paidOrder(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        (new RefundService())->refund((int) $order->id);
        try {
            (new RefundService())->refund((int) $order->id);
            $this->fail('已退款订单不可重复退款');
        } catch (BizException $e) {
            $this->assertSame(Code::STATE_INVALID, $e->getBizCode());
        }
    }

    public function testRefundEndpointRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('POST', '/admin/orders/1/refund')->getCode());
    }

    public function testAdminRefundEndpoint(): void
    {
        $order = $this->paidOrder(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $token = $this->makeAdminToken();
        $r = $this->callJson('POST', '/admin/orders/' . $order->id . '/refund', ['reason' => '协商退款'], $this->bearer($token));
        $this->assertSame(0, $r['code']);
        $this->assertSame(Order::STATUS_REFUNDED, (int) Order::find($order->id)->status);
    }
}
