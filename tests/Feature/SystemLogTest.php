<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\model\SystemLog;
use app\service\OrderService;
use app\service\SystemLogService;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 系统日志:record 落库 + list 分页/筛选;验签失败回调能查到 pay_verify_fail;
 * 记录失败不影响主流程(验签失败回调仍返回原应答)。
 */
class SystemLogTest extends TestCase
{
    private const KEY = 'secretkey';

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->token = $this->makeAdminToken();
    }

    private function hdr(): array
    {
        return $this->bearer($this->token);
    }

    public function testRecordPersistsWithContextAndOrderNo(): void
    {
        (new SystemLogService())->record('login_fail', SystemLog::LEVEL_WARNING, '登录失败', ['ip' => '1.2.3.4'], 'ON123');

        $log = SystemLog::order('id', 'desc')->find();
        $this->assertSame('login_fail', $log->type);
        $this->assertSame('warning', $log->level);
        $this->assertSame('ON123', $log->order_no);
        $this->assertSame('1.2.3.4', $log->context['ip']);
        $this->assertNotEmpty($log->create_time);
    }

    public function testRecordFailureNeverThrows(): void
    {
        // 即便 message 含 emoji / 超长也不应抛出;空 level 退化为 info
        $svc = new SystemLogService();
        $svc->record('settle_exception', '', str_repeat('x', 1000));
        $log = SystemLog::where('type', 'settle_exception')->order('id', 'desc')->find();
        $this->assertSame('info', $log->level);
        $this->assertSame(500, mb_strlen($log->message));
    }

    public function testListPaginationAndFilter(): void
    {
        $svc = new SystemLogService();
        for ($i = 0; $i < 3; $i++) {
            $svc->record('withdraw_approve', SystemLog::LEVEL_INFO, 'a' . $i);
        }
        $svc->record('pay_verify_fail', SystemLog::LEVEL_WARNING, 'v');

        // 按 type 筛选
        $r = $svc->list(['type' => 'withdraw_approve'], 1, 20);
        $this->assertSame(3, $r['total']);
        foreach ($r['items'] as $it) {
            $this->assertSame('withdraw_approve', $it['type']);
        }

        // 按 level 筛选
        $r2 = $svc->list(['level' => 'warning'], 1, 20);
        $this->assertSame(1, $r2['total']);
        $this->assertSame('pay_verify_fail', $r2['items'][0]['type']);

        // 分页
        $page1 = $svc->list(['type' => 'withdraw_approve'], 1, 2);
        $this->assertCount(2, $page1['items']);
        $page2 = $svc->list(['type' => 'withdraw_approve'], 2, 2);
        $this->assertCount(1, $page2['items']);
        $this->assertSame(2, $page2['page']);
    }

    public function testAdminLogsEndpointRequiresAuthAndFilters(): void
    {
        (new SystemLogService())->record('withdraw_reject', SystemLog::LEVEL_INFO, 'r');

        // 需鉴权
        $this->assertSame(401, $this->call('GET', '/admin/logs')->getCode());

        $r = $this->callJson('GET', '/admin/logs', ['type' => 'withdraw_reject'], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame('withdraw_reject', $r['data']['items'][0]['type']);
        $this->assertArrayHasKey('page', $r['data']);
    }

    public function testForgedCallbackLoggedButReturnsOriginalAck(): void
    {
        // 准备一笔可发货订单 + epay 渠道 + 支付单
        $m = $this->makeMerchant(['commission_rate' => '0.1000']);
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 2; $i++) {
            $s = 'SL-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => 2]);
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);
        $payment = Payment::create([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id,
            'merchant_id' => $m->id, 'channel' => 'epay', 'amount' => '20.00', 'status' => Payment::STATUS_PENDING,
        ]);

        // 伪造签名的成功回调
        $params = [
            'pid' => '1001', 'out_trade_no' => $payment->payment_no,
            'trade_no' => 'CH_' . uniqid(), 'money' => '20.00',
            'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
            'sign' => 'forged_signature_value', 'sign_type' => 'MD5',
        ];
        $ack = $this->call('GET', '/pay/notify/epay', $params)->getContent();

        // 原应答行为不变:验签失败仍返回非 success、订单零状态变更
        $this->assertNotSame('success', $ack);
        $this->assertSame(Order::STATUS_PENDING, Order::find($order->id)->status);
        $this->assertSame(Payment::STATUS_PENDING, Payment::find($payment->id)->status);
        $this->assertSame('0.00', Merchant::find($m->id)->balance);

        // 能查到 pay_verify_fail 日志
        $log = SystemLog::where('type', 'pay_verify_fail')->order('id', 'desc')->find();
        $this->assertNotNull($log);
        $this->assertSame('warning', $log->level);
        $this->assertSame($payment->payment_no, $log->order_no);
        $this->assertSame('epay', $log->context['channel']);
    }
}
