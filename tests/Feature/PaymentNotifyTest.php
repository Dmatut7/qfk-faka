<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use app\util\OrderNo;
use tests\TestCase;
use think\facade\Db;

/**
 * 支付回调发货 + 三大安全保证 (T6.4b / T6.5)。
 *
 * 1) 防伪造:验签失败一律拒绝、绝不发货、零状态变更;
 * 2) 防金额篡改:回调金额≠订单金额一律拒绝;
 * 3) 防重复(幂等):同一支付重复回调只发货一次、只结算一次。
 */
class PaymentNotifyTest extends TestCase
{
    private const KEY = 'secretkey';

    private Merchant $m;
    private Product $p;
    private Order $order;
    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant(['commission_rate' => '0.1000']); // 抽佣 10%
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 2; $i++) {
            $s = 'PN-' . $this->p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => 2]);
        $this->order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']); // total 20.00
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);
        $this->payment = Payment::create([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $this->order->id,
            'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => '20.00', 'status' => Payment::STATUS_PENDING,
        ]);
    }

    private function epaySign(array $params, string $key): string
    {
        unset($params['sign'], $params['sign_type']);
        $params = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($params);
        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        return md5(implode('&', $parts) . $key);
    }

    private function makeCallback(string $money = '20.00', array $override = []): array
    {
        $params = array_merge([
            'pid' => '1001', 'out_trade_no' => $this->payment->payment_no,
            'trade_no' => 'CH_' . uniqid(), 'money' => $money,
            'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
        ], $override);
        $params['sign'] = $this->epaySign($params, self::KEY);
        $params['sign_type'] = 'MD5';
        return $params;
    }

    private function notify(array $params): string
    {
        return $this->call('GET', '/pay/notify/epay', $params)->getContent();
    }

    // ===== 正常发货链路 (T6.4b) =====
    public function testValidCallbackDeliversAndSettles(): void
    {
        $ack = $this->notify($this->makeCallback('20.00'));
        $this->assertSame('success', $ack);

        // 订单已发货,2 张卡售出,快照写入
        $this->assertSame(Order::STATUS_DELIVERED, Order::find($this->order->id)->status);
        $this->assertSame(2, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_SOLD)->count());
        $secrets = Card::where('order_id', $this->order->id)->order('id', 'asc')->column('secret');
        $this->assertSame(implode("\n", $secrets), Order::find($this->order->id)->delivered_content);

        // 支付单成功
        $pay = Payment::find($this->payment->id);
        $this->assertSame(Payment::STATUS_SUCCESS, $pay->status);
        $this->assertSame('20.00', $pay->paid_amount);
        $this->assertNotEmpty($pay->channel_trade_no);

        // 结算:商户余额 += 入账 18.00(20 - 10% 佣金)
        $this->assertSame('18.00', Merchant::find($this->m->id)->balance);
        $logs = MerchantFundLog::where('order_id', $this->order->id)->select();
        $this->assertCount(2, $logs);
        $income = MerchantFundLog::where('order_id', $this->order->id)->where('type', MerchantFundLog::TYPE_INCOME)->find();
        $commission = MerchantFundLog::where('order_id', $this->order->id)->where('type', MerchantFundLog::TYPE_COMMISSION)->find();
        $this->assertSame('20.00', $income->amount);
        $this->assertSame('-2.00', $commission->amount);
        $this->assertSame('18.00', $commission->balance_after);
    }

    // ===== 保证 1:防伪造 =====
    public function testForgedSignatureRejectedNeverDelivers(): void
    {
        $params = $this->makeCallback('20.00');
        $params['sign'] = 'forged_signature_value'; // 伪造签名
        $ack = $this->notify($params);

        $this->assertNotSame('success', $ack, '伪造回调必须返回非成功应答');
        // 零状态变更
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
        $this->assertSame(2, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_LOCKED)->count());
        $this->assertSame(Payment::STATUS_PENDING, Payment::find($this->payment->id)->status);
        $this->assertSame('0.00', Merchant::find($this->m->id)->balance);
    }

    public function testMissingSignatureRejected(): void
    {
        $params = $this->makeCallback('20.00');
        unset($params['sign']);
        $this->assertNotSame('success', $this->notify($params));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    public function testTamperedFieldBreaksSignature(): void
    {
        $params = $this->makeCallback('20.00');
        $params['money'] = '0.01'; // 改金额但不重算签名 → 验签失败
        $this->assertNotSame('success', $this->notify($params));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    // ===== 保证 2:防金额篡改(签名有效但金额不符) =====
    public function testAmountMismatchRejectedNeverDelivers(): void
    {
        // 用真实密钥对"少付"金额签名(模拟验签通过但金额不符)
        $ack = $this->notify($this->makeCallback('0.01'));
        $this->assertNotSame('success', $ack, '金额不符必须拒绝');

        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
        $this->assertSame(2, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_LOCKED)->count());
        $this->assertSame('0.00', Merchant::find($this->m->id)->balance, '不能少付也发货/结算');
    }

    public function testOverpayAlsoStrictlyRejected(): void
    {
        // 多付同样视为不一致(严格相等)
        $this->assertNotSame('success', $this->notify($this->makeCallback('99.99')));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    public function testEmptyChannelTradeNoRejected(): void
    {
        // 成功回调但无渠道交易号 → 拒绝(空 trade_no 无法二级幂等去重,spec §10.2)
        $this->assertNotSame('success', $this->notify($this->makeCallback('20.00', ['trade_no' => ''])));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    public function testNonCnyCurrencyRejected(): void
    {
        // 携带非 CNY 币种(合法签名)→ 拒绝(spec §10.4.2)
        $this->assertNotSame('success', $this->notify($this->makeCallback('20.00', ['currency' => 'USD'])));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    public function testMalformedMoneyRejected(): void
    {
        // 非良构金额(合法签名)→ 拒绝,绝不被 bcmath 当 0 放过
        $this->assertNotSame('success', $this->notify($this->makeCallback('abc')));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
        $this->assertSame('0.00', Merchant::find($this->m->id)->balance);
    }

    // ===== 保证 3:防重复(幂等) =====
    public function testDuplicateCallbackDeliversOnce(): void
    {
        $cb = $this->makeCallback('20.00');
        $this->assertSame('success', $this->notify($cb));
        // 同一回调再次投递
        $this->assertSame('success', $this->notify($cb), '重复回调应仍返回成功应答');

        // 只发货一次、只结算一次
        $this->assertSame(2, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_SOLD)->count(), '卡密不得被重复消耗');
        $this->assertSame('18.00', Merchant::find($this->m->id)->balance, '余额不得被重复入账');
        $this->assertSame(2, MerchantFundLog::where('order_id', $this->order->id)->count(), '流水不得重复');
    }

    // ===== 归属攻击 =====
    public function testChannelOwnershipMismatchRejected(): void
    {
        // 支付单实际渠道为 wxpay,却走 epay 回调 → 归属不符
        Db::name('payments')->where('id', $this->payment->id)->update(['channel' => 'wxpay']);
        $this->assertNotSame('success', $this->notify($this->makeCallback('20.00')));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    public function testUnknownPaymentRejected(): void
    {
        $params = $this->makeCallback('20.00', ['out_trade_no' => 'PAYNOTEXIST']);
        $this->assertNotSame('success', $this->notify($params));
    }

    // ===== 超时关闭后又支付成功 → 异常待人工 =====
    public function testTimeoutClosedThenPaidGoesException(): void
    {
        Db::name('orders')->where('id', $this->order->id)->update(['status' => Order::STATUS_CLOSED]);
        $ack = $this->notify($this->makeCallback('20.00'));

        $this->assertSame('success', $ack, '应答成功以止重试');
        $this->assertSame(Order::STATUS_EXCEPTION, Order::find($this->order->id)->status, '转 4005 异常待人工');
        $this->assertSame(Payment::STATUS_SUCCESS, Payment::find($this->payment->id)->status, '支付仍记成功');
        // 不发货(卡未售)
        $this->assertSame(0, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_SOLD)->count());
    }

    // ===== 卡不足(被释放/作废)→ 异常,但结算照常、应答成功止重试 =====
    public function testCardShortageGoesExceptionButSettles(): void
    {
        // 释放本单一张锁定卡,制造"卡不足"
        $oneCard = Card::where('order_id', $this->order->id)->where('status', Card::STATUS_LOCKED)->find();
        Db::name('cards')->where('id', $oneCard->id)->update(['status' => Card::STATUS_UNSOLD, 'order_id' => null]);

        $ack = $this->notify($this->makeCallback('20.00'));
        $this->assertSame('success', $ack);
        $this->assertSame(Order::STATUS_EXCEPTION, Order::find($this->order->id)->status);
        // 商户已收款 → 结算照常(转人工补货)
        $this->assertSame('18.00', Merchant::find($this->m->id)->balance);
    }

    // ===== 停用渠道的在途回调仍处理 =====
    public function testDisabledChannelStillProcessesInflightCallback(): void
    {
        PaymentChannel::where('code', 'epay')->update(['status' => PaymentChannel::STATUS_DISABLED]);
        $ack = $this->notify($this->makeCallback('20.00'));
        $this->assertSame('success', $ack, '停用渠道仍须处理已存在支付单的在途回调');
        $this->assertSame(Order::STATUS_DELIVERED, Order::find($this->order->id)->status);
    }

    // ===== 交易未成功不发货 =====
    public function testNonSuccessTradeStatusNoDelivery(): void
    {
        $this->notify($this->makeCallback('20.00', ['trade_status' => 'WAIT_BUYER_PAY']));
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
    }

    // ===== L18:渠道交易号唯一冲突(uniq_channel_trade)不得 fail 致网关无限重投 =====
    public function testDuplicateChannelTradeNoAcksSuccessNotInfiniteRetry(): void
    {
        // 预置:同渠道下 'DUP-XYZ' 这个交易号已被另一笔成功支付占用(uniq_channel_trade)
        Payment::create([
            'payment_no'       => OrderNo::generate('PAY'),
            'order_id'         => $this->order->id,
            'merchant_id'      => $this->m->id,
            'channel'          => 'epay',
            'amount'           => '20.00',
            'status'           => Payment::STATUS_SUCCESS,
            'channel_trade_no' => 'DUP-XYZ',
        ]);

        // 本单收到携带相同 trade_no 的合法回调 → markPaymentSuccess 写入时撞唯一约束(1062)
        $ack = $this->notify($this->makeCallback('20.00', ['trade_no' => 'DUP-XYZ']));

        // 核心:必须成功应答止重试,绝不能 fail(否则网关无限重投同一回调)
        $this->assertSame('success', $ack, '唯一约束冲突须成功应答止重试,而非 fail 致网关无限重投');

        // 本单无法入账 → 不发货、卡仍锁定、余额零(绝不因撞库而误发/误结算)
        $this->assertSame(Order::STATUS_PENDING, Order::find($this->order->id)->status);
        $this->assertSame(2, Card::where('order_id', $this->order->id)->where('status', Card::STATUS_LOCKED)->count());
        $this->assertSame('0.00', Merchant::find($this->m->id)->balance);
    }
}
