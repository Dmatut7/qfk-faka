<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Order;
use app\model\Product;
use tests\TestCase;
use think\facade\Db;

/**
 * 买家下单与订单查询 (T5.5)。
 */
class BuyerOrderTest extends TestCase
{
    private $m;
    private $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '5.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        $this->addCards(3);
    }

    private function addCards(int $n): void
    {
        for ($i = 0; $i < $n; $i++) {
            $s = 'BO-' . $this->p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $this->p->id)->update(['stock' => Db::raw("stock + {$n}")]);
    }

    public function testCreateOrderEndpoint(): void
    {
        $r = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'buyer@x.com']);
        $this->assertSame(0, $r['code']);
        $this->assertNotEmpty($r['data']['order_no']);
        $this->assertSame('10.00', $r['data']['total_amount']);
        $this->assertSame(Order::STATUS_PENDING, $r['data']['status']);
    }

    public function testCreateInsufficientStock(): void
    {
        $r = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 99, 'buyer_email' => 'buyer@x.com']);
        $this->assertSame(Code::STOCK_NOT_ENOUGH, $r['code']);
    }

    public function testCreateBadEmail(): void
    {
        $resp = $this->call('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'not-an-email']);
        $this->assertSame(422, $resp->getCode());
    }

    public function testQueryPendingDoesNotLeakCards(): void
    {
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $no = $created['data']['order_no'];

        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $no, 'email' => 'buyer@x.com']);
        $this->assertSame(0, $q['code']);
        $this->assertSame(Order::STATUS_PENDING, $q['data']['status']);
        $this->assertSame([], $q['data']['cards'], '未发货不得泄露卡密');
    }

    public function testQueryWrongEmail403(): void
    {
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $resp = $this->call('POST', '/buyer/order/query', ['order_no' => $created['data']['order_no'], 'email' => 'attacker@x.com']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testQueryUnknownOrder404(): void
    {
        $resp = $this->call('POST', '/buyer/order/query', ['order_no' => 'NOPE123456', 'email' => 'buyer@x.com']);
        $this->assertSame(404, $resp->getCode());
    }

    public function testQueryByPasswordWhenSet(): void
    {
        $created = $this->callJson('POST', '/buyer/order', [
            'product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com', 'query_password' => 'pass123',
        ]);
        $no = $created['data']['order_no'];

        // 用查单密码查得到(无需邮箱)
        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $no, 'password' => 'pass123']);
        $this->assertSame(0, $q['code']);
        $this->assertSame(Order::STATUS_PENDING, $q['data']['status']);

        // 明文不落库
        $order = Order::where('order_no', $no)->find();
        $this->assertNotSame('pass123', (string) $order->query_password);
        $this->assertTrue(password_verify('pass123', (string) $order->query_password));
    }

    public function testQueryWrongPassword403(): void
    {
        $created = $this->callJson('POST', '/buyer/order', [
            'product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com', 'query_password' => 'right',
        ]);
        $resp = $this->call('POST', '/buyer/order/query', ['order_no' => $created['data']['order_no'], 'password' => 'wrong']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testQueryByPasswordRejectedWhenNotSet(): void
    {
        // 未设置查单密码的订单不能用密码查(防绕过邮箱)
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $resp = $this->call('POST', '/buyer/order/query', ['order_no' => $created['data']['order_no'], 'password' => 'anything']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testQueryRequiresSomeCredential(): void
    {
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $r = $this->callJson('POST', '/buyer/order/query', ['order_no' => $created['data']['order_no']]);
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }

    public function testQueryDeliveredReturnsCards(): void
    {
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $this->p->id, 'quantity' => 2, 'buyer_email' => 'buyer@x.com']);
        $order = Order::where('order_no', $created['data']['order_no'])->find();

        // 模拟发货完成:订单已发货,锁定卡转已售,写快照
        $secrets = Card::where('order_id', $order->id)->column('secret');
        Db::name('cards')->where('order_id', $order->id)->update(['status' => Card::STATUS_SOLD]);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_DELIVERED, 'delivered_content' => implode("\n", $secrets)]);

        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $order->order_no, 'email' => 'buyer@x.com']);
        $this->assertSame(Order::STATUS_DELIVERED, $q['data']['status']);
        $this->assertCount(2, $q['data']['cards']);
        $this->assertEqualsCanonicalizing($secrets, $q['data']['cards']);
    }
}
