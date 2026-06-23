<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Complaint;
use app\model\Merchant;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 投诉/售后全链路:买家发起 → 商户回复 → 买家申请介入 → 平台裁决(联动退款)。
 */
class ComplaintTest extends TestCase
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
            $s = 'CP-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => 2]);
        PaymentChannel::create(['code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver', 'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'], 'status' => PaymentChannel::STATUS_ENABLED]);
    }

    private function paidOrder(): Order
    {
        $order = (new OrderService())->create(['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $payment = Payment::create(['payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id, 'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => $order->total_amount, 'status' => Payment::STATUS_PENDING]);
        $params = ['pid' => '1001', 'out_trade_no' => $payment->payment_no, 'trade_no' => 'CH_' . uniqid(), 'money' => (string) $order->total_amount, 'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单'];
        $f = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($f);
        $parts = [];
        foreach ($f as $k => $v) { $parts[] = $k . '=' . $v; }
        $params['sign'] = md5(implode('&', $parts) . self::KEY);
        $params['sign_type'] = 'MD5';
        $this->call('GET', '/pay/notify/epay', $params);
        return Order::find($order->id);
    }

    public function testFullChainBuyerMerchantPlatformWithRefund(): void
    {
        $order = $this->paidOrder();
        $this->assertSame('9.00', Money::add((string) Merchant::find($this->m->id)->balance, '0')); // 净9

        // 1) 买家发起
        $r = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => Complaint::TYPE_INVALID_CARD, 'description' => '卡密无法使用']);
        $this->assertSame(0, $r['code']);
        $cid = $r['data']['id'];
        $this->assertSame(Complaint::STATUS_OPEN, (int) Complaint::find($cid)->status);

        // 2) 商户回复 → REPLIED
        $mtok = $this->bearer($this->merchantToken((int) $this->m->id));
        $rr = $this->callJson('POST', '/merchant/complaints/' . $cid . '/reply', ['reply' => '请重试或联系客服'], $mtok);
        $this->assertSame(0, $rr['code']);
        $this->assertSame(Complaint::STATUS_REPLIED, (int) Complaint::find($cid)->status);

        // 3) 买家申请平台介入 → INTERVENE
        $re = $this->callJson('POST', '/buyer/complaint/' . $cid . '/escalate', ['order_no' => $order->order_no, 'email' => 'buyer@x.com']);
        $this->assertSame(Complaint::STATUS_INTERVENE, (int) Complaint::find($cid)->status);

        // 4) 平台裁决:解决 + 联动退款
        $atok = $this->bearer($this->makeAdminToken());
        $ra = $this->callJson('POST', '/admin/complaints/' . $cid . '/resolve', ['remark' => '卡密确有问题,退款', 'refund' => 1], $atok);
        $this->assertSame(0, $ra['code']);
        $this->assertSame(Complaint::STATUS_RESOLVED, (int) Complaint::find($cid)->status);
        $this->assertSame(1, (int) Complaint::find($cid)->refunded);
        // 退款联动:订单已退款、卡密回库、余额冲回 0
        $this->assertSame(Order::STATUS_REFUNDED, (int) Order::find($order->id)->status);
        $this->assertSame('0.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
    }

    public function testFileRequiresOrderOwnership(): void
    {
        $order = $this->paidOrder();
        $r = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'attacker@x.com', 'type' => 4, 'description' => 'x']);
        $this->assertSame(Code::FORBIDDEN, $r['code']);
    }

    /** L28 防订单枚举:不存在的订单号 与 邮箱不匹配 必须返回完全相同的错误码,不可区分 */
    public function testFileDoesNotLeakOrderExistence(): void
    {
        $order = $this->paidOrder();
        // (a) 真实订单 + 错误邮箱
        $wrongEmail = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'attacker@x.com', 'type' => 4, 'description' => 'x']);
        // (b) 完全不存在的订单号(同样的邮箱)
        $noSuchOrder = $this->callJson('POST', '/buyer/complaint', ['order_no' => 'NO-SUCH-ORDER-XYZ', 'email' => 'attacker@x.com', 'type' => 4, 'description' => 'x']);

        $this->assertSame(Code::FORBIDDEN, $wrongEmail['code']);
        $this->assertSame(Code::FORBIDDEN, $noSuchOrder['code'], '订单不存在不得返回与邮箱不匹配不同的错误码(防枚举)');
        $this->assertSame($wrongEmail['code'], $noSuchOrder['code'], '两种失败必须不可区分');
        $this->assertSame($wrongEmail['msg'], $noSuchOrder['msg'], '两种失败的提示文案也必须一致');
    }

    public function testCannotFileDuplicateActiveComplaint(): void
    {
        $order = $this->paidOrder();
        $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => '第一次']);
        $r2 = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => '又一次']);
        $this->assertSame(Code::STATE_INVALID, $r2['code']);
    }

    /** M4 防刷:每订单投诉总数达上限(含已驳回)后,不可再无限重开。 */
    public function testComplaintPerOrderCapPreventsSpam(): void
    {
        $order = $this->paidOrder();
        $admin = $this->bearer($this->makeAdminToken());
        // 反复「投诉→驳回」5 次(驳回后非 ACTIVE,可再投诉),用满配额
        for ($i = 0; $i < 5; $i++) {
            $r = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => "第{$i}次"]);
            $this->assertSame(0, $r['code'], "第{$i}次应成功");
            $this->callJson('POST', '/admin/complaints/' . $r['data']['id'] . '/reject', ['remark' => 'x'], $admin);
        }
        // 第 6 次:超过每订单上限 → 拒绝
        $r6 = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => '第6次']);
        $this->assertSame(Code::STATE_INVALID, $r6['code']);
    }

    public function testMerchantOnlySeesOwnComplaints(): void
    {
        $order = $this->paidOrder();
        $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => 'x']);
        $other = $this->makeMerchant();
        $list = $this->callJson('GET', '/merchant/complaints', [], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertCount(0, $list['data']['items']);
        $mine = $this->callJson('GET', '/merchant/complaints', [], $this->bearer($this->merchantToken((int) $this->m->id)));
        $this->assertCount(1, $mine['data']['items']);
    }

    public function testPlatformRejectClosesComplaint(): void
    {
        $order = $this->paidOrder();
        $c = $this->callJson('POST', '/buyer/complaint', ['order_no' => $order->order_no, 'email' => 'buyer@x.com', 'type' => 4, 'description' => 'x'])['data']['id'];
        $r = $this->callJson('POST', '/admin/complaints/' . $c . '/reject', ['remark' => '证据不足'], $this->bearer($this->makeAdminToken()));
        $this->assertSame(Complaint::STATUS_REJECTED, (int) Complaint::find($c)->status);
        // 已结束不可再回复
        $rr = $this->callJson('POST', '/merchant/complaints/' . $c . '/reply', ['reply' => 'x'], $this->bearer($this->merchantToken((int) $this->m->id)));
        $this->assertSame(Code::STATE_INVALID, $rr['code']);
    }

    public function testEndpointsRequireAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/merchant/complaints')->getCode());
        $this->assertSame(401, $this->call('GET', '/admin/complaints')->getCode());
    }
}
