<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Order;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;
use think\facade\Db;

/**
 * 订单超时回收 (T5.4, TDD):关单 + 释放锁定卡 + 回补库存,幂等。
 */
class OrderReclaimTest extends TestCase
{
    private OrderService $svc;
    private $m;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new OrderService();
        $this->m = $this->makeMerchant();
    }

    private function productWithCards(int $n): Product
    {
        $p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '2.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < $n; $i++) {
            $s = 'RC-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => $n]);
        return $p;
    }

    private function makeExpiredOrder(Product $p, int $qty): Order
    {
        $order = $this->svc->create(['product_id' => $p->id, 'quantity' => $qty, 'buyer_email' => 'b@x.com']);
        Db::name('orders')->where('id', $order->id)->update(['expire_at' => date('Y-m-d H:i:s', time() - 60)]);
        return Order::find($order->id);
    }

    public function testReclaimReleasesCardsAndRestoresStock(): void
    {
        $p = $this->productWithCards(5);
        $order = $this->makeExpiredOrder($p, 2);

        // 下单后:2 锁定 / 3 未售 / stock 3
        $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count());
        $this->assertSame(3, (int) Product::where('id', $p->id)->value('stock'));

        $n = $this->svc->reclaimExpired();
        $this->assertSame(1, $n);

        // 订单关闭
        $this->assertSame(Order::STATUS_CLOSED, Order::find($order->id)->status);
        // 卡释放回未售、order_id 清空
        $this->assertSame(0, Card::where('order_id', $order->id)->count());
        $this->assertSame(5, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        // stock 回补
        $this->assertSame(5, (int) Product::where('id', $p->id)->value('stock'));
    }

    public function testReclaimIsIdempotent(): void
    {
        $p = $this->productWithCards(3);
        $this->makeExpiredOrder($p, 2);

        $this->assertSame(1, $this->svc->reclaimExpired());
        // 第二次无副作用
        $this->assertSame(0, $this->svc->reclaimExpired());
        $this->assertSame(3, (int) Product::where('id', $p->id)->value('stock'), 'stock 不应被重复回补');
        $this->assertSame(3, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
    }

    public function testDoesNotReclaimActiveOrder(): void
    {
        $p = $this->productWithCards(3);
        // 未过期(expire_at 默认 +15min)
        $order = $this->svc->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);

        $this->assertSame(0, $this->svc->reclaimExpired());
        $this->assertSame(Order::STATUS_PENDING, Order::find($order->id)->status);
        $this->assertSame(1, Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count());
    }

    public function testDoesNotReclaimPaidOrder(): void
    {
        $p = $this->productWithCards(3);
        $order = $this->makeExpiredOrder($p, 1);
        // 标记为已支付(模拟回调已处理)
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);

        $this->assertSame(0, $this->svc->reclaimExpired());
        $this->assertSame(Order::STATUS_PAID, Order::find($order->id)->status);
        // 卡仍锁定,未被误释放
        $this->assertSame(1, Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count());
    }

    public function testDoesNotReleaseSoldCard(): void
    {
        $p = $this->productWithCards(3);
        $order = $this->makeExpiredOrder($p, 2);
        // 防御场景:本单一张卡已被推进为已售(2)
        $soldCard = Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->find();
        Db::name('cards')->where('id', $soldCard->id)->update(['status' => Card::STATUS_SOLD]);

        $this->svc->reclaimExpired();

        // 已售卡不应被释放,仍归属本单
        $reloaded = Card::find($soldCard->id);
        $this->assertSame(Card::STATUS_SOLD, $reloaded->status);
        $this->assertSame($order->id, (int) $reloaded->order_id);
    }
}
