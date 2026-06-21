<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;
use think\facade\Db;

/**
 * 发起支付 (T6.3)。
 */
class PaymentInitiateTest extends TestCase
{
    private $m;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '9.99', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < 3; $i++) {
            $s = 'PI-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => 3]);
        $this->order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $this->epayChannel();
    }

    private function epayChannel(int $status = PaymentChannel::STATUS_ENABLED): void
    {
        if (!PaymentChannel::where('code', 'epay')->find()) {
            PaymentChannel::create([
                'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
                'config' => ['pid' => '1001', 'key' => 'secretkey', 'gateway' => 'https://pay.example.com'],
                'status' => $status,
            ]);
        } else {
            PaymentChannel::where('code', 'epay')->update(['status' => $status]);
        }
    }

    public function testInitiateCreatesPaymentAndPayParams(): void
    {
        $r = $this->callJson('POST', '/buyer/order/' . $this->order->order_no . '/pay', ['channel' => 'epay']);
        $this->assertSame(0, $r['code']);
        $this->assertNotEmpty($r['data']['payment_no']);
        $this->assertStringContainsString('pay.example.com', $r['data']['pay']['url']);
        $this->assertArrayHasKey('sign', $r['data']['pay']['params']);
        $this->assertSame('9.99', $r['data']['pay']['params']['money']);

        // 支付单已落库
        $pay = Payment::where('payment_no', $r['data']['payment_no'])->find();
        $this->assertNotNull($pay);
        $this->assertSame(Payment::STATUS_PENDING, $pay->status);
        $this->assertSame('9.99', $pay->amount);
        $this->assertSame((int) $this->order->id, $pay->order_id);
        $this->assertSame((int) $this->m->id, $pay->merchant_id);
    }

    public function testAlreadyPaidRejected(): void
    {
        Db::name('orders')->where('id', $this->order->id)->update(['status' => Order::STATUS_PAID]);
        $r = $this->callJson('POST', '/buyer/order/' . $this->order->order_no . '/pay', ['channel' => 'epay']);
        $this->assertSame(Code::ORDER_PAID, $r['code']);
    }

    public function testExpiredRejected(): void
    {
        Db::name('orders')->where('id', $this->order->id)->update(['expire_at' => date('Y-m-d H:i:s', time() - 60)]);
        $r = $this->callJson('POST', '/buyer/order/' . $this->order->order_no . '/pay', ['channel' => 'epay']);
        $this->assertSame(Code::ORDER_CLOSED, $r['code']);
    }

    public function testClosedRejected(): void
    {
        Db::name('orders')->where('id', $this->order->id)->update(['status' => Order::STATUS_CLOSED]);
        $r = $this->callJson('POST', '/buyer/order/' . $this->order->order_no . '/pay', ['channel' => 'epay']);
        $this->assertSame(Code::ORDER_CLOSED, $r['code']);
    }

    public function testDisabledChannelRejected(): void
    {
        $this->epayChannel(PaymentChannel::STATUS_DISABLED);
        $r = $this->callJson('POST', '/buyer/order/' . $this->order->order_no . '/pay', ['channel' => 'epay']);
        $this->assertSame(Code::CHANNEL_UNAVAILABLE, $r['code']);
    }

    public function testUnknownOrder404(): void
    {
        $resp = $this->call('POST', '/buyer/order/NOPE999/pay', ['channel' => 'epay']);
        $this->assertSame(404, $resp->getCode());
    }
}
