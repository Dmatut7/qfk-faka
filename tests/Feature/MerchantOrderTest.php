<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;
use think\facade\Db;

/**
 * 商户订单管理 (T7.1):列表/详情/归属/手动关闭/补发。
 */
class MerchantOrderTest extends TestCase
{
    private function ctx(int $cards = 2): array
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        for ($i = 0; $i < $cards; $i++) {
            $s = 'MO-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => $cards]);
        return [$m, $p];
    }

    private function order(Merchant $m, Product $p, int $qty = 2): Order
    {
        return (new OrderService())->create(['product_id' => $p->id, 'quantity' => $qty, 'buyer_email' => 'b@x.com']);
    }

    public function testListOnlyOwnOrders(): void
    {
        [$mA, $pA] = $this->ctx();
        [$mB, $pB] = $this->ctx();
        $this->order($mA, $pA);
        $this->order($mB, $pB);

        $list = $this->callJson('GET', '/merchant/orders', [], $this->bearer($this->merchantToken((int) $mA->id)));
        $this->assertSame(1, $list['data']['total']);
        $this->assertSame((int) $mA->id, $list['data']['items'][0]['merchant_id']);
    }

    public function testDetailOwnershipAndCards(): void
    {
        [$m, $p] = $this->ctx();
        $order = $this->order($m, $p);
        $token = $this->merchantToken((int) $m->id);

        $d = $this->callJson('GET', '/merchant/orders/' . $order->id, [], $this->bearer($token));
        $this->assertSame($order->order_no, $d['data']['order_no']);

        // 他人订单 → 403
        $other = $this->makeMerchant();
        $resp = $this->call('GET', '/merchant/orders/' . $order->id, [], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $resp->getCode());
    }

    public function testFilterByStatus(): void
    {
        [$m, $p] = $this->ctx(4);
        $o1 = $this->order($m, $p, 1);
        $o2 = $this->order($m, $p, 1);
        Db::name('orders')->where('id', $o2->id)->update(['status' => Order::STATUS_CLOSED]);

        $token = $this->bearer($this->merchantToken((int) $m->id));
        $pending = $this->callJson('GET', '/merchant/orders', ['status' => Order::STATUS_PENDING], $token);
        $this->assertSame(1, $pending['data']['total']);
        $this->assertSame((int) $o1->id, $pending['data']['items'][0]['id']);
    }

    public function testCloseReleasesCards(): void
    {
        [$m, $p] = $this->ctx();
        $order = $this->order($m, $p, 2);
        $token = $this->bearer($this->merchantToken((int) $m->id));

        $r = $this->callJson('POST', '/merchant/orders/' . $order->id . '/close', [], $token);
        $this->assertSame(0, $r['code']);
        $this->assertSame(Order::STATUS_CLOSED, Order::find($order->id)->status);
        // 卡释放、库存回补
        $this->assertSame(0, Card::where('order_id', $order->id)->count());
        $this->assertSame(2, (int) Product::where('id', $p->id)->value('stock'));
    }

    public function testCloseNonPendingRejected(): void
    {
        [$m, $p] = $this->ctx();
        $order = $this->order($m, $p, 1);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);

        $r = $this->callJson('POST', '/merchant/orders/' . $order->id . '/close', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testRedeliverPaidOrder(): void
    {
        [$m, $p] = $this->ctx(2);
        $order = $this->order($m, $p, 2); // 2 卡锁定
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);

        $r = $this->callJson('POST', '/merchant/orders/' . $order->id . '/redeliver', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(0, $r['code']);
        $this->assertSame(Order::STATUS_DELIVERED, Order::find($order->id)->status);
        $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->count());
    }

    public function testRedeliverAfterShortageWithNewStock(): void
    {
        [$m, $p] = $this->ctx(2);
        $order = $this->order($m, $p, 2);
        // 模拟卡不足异常:释放一张锁定卡
        $one = Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->find();
        Db::name('cards')->where('id', $one->id)->update(['status' => Card::STATUS_UNSOLD, 'order_id' => null]);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_EXCEPTION]);
        // card_shortage 异常单是已结算的(doSettle 已入账);补结算流水使其忠实于真实态(B3 允许已结算异常单补发)
        MerchantFundLog::create(['merchant_id' => $m->id, 'type' => MerchantFundLog::TYPE_INCOME, 'amount' => '20.00', 'balance_after' => '20.00', 'order_id' => $order->id, 'remark' => 'x']);
        // 商户补一张新卡
        $s = 'NEW-' . uniqid();
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        Db::name('products')->where('id', $p->id)->update(['stock' => Db::raw('stock + 1')]);

        $r = $this->callJson('POST', '/merchant/orders/' . $order->id . '/redeliver', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(0, $r['code']);
        $this->assertSame(Order::STATUS_DELIVERED, Order::find($order->id)->status);
        $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->count());
    }

    public function testProductTitleSnapshotInListAndDetail(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => '原始商品名', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        $s = 'PT-' . $p->id . '-' . uniqid();
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        Product::where('id', $p->id)->update(['stock' => 1]);
        $order = $this->order($m, $p, 1);

        // 下单即写入快照
        $this->assertSame('原始商品名', Order::find($order->id)->product_title);

        // 商品改名后,订单仍显示下单时的商品名
        Product::where('id', $p->id)->update(['title' => '改名后的商品']);
        $token = $this->bearer($this->merchantToken((int) $m->id));

        $list = $this->callJson('GET', '/merchant/orders', [], $token);
        $row  = null;
        foreach ($list['data']['items'] as $it) {
            if ((int) $it['id'] === (int) $order->id) { $row = $it; break; }
        }
        $this->assertNotNull($row);
        $this->assertSame('原始商品名', $row['product_title']);

        $d = $this->callJson('GET', '/merchant/orders/' . $order->id, [], $token);
        $this->assertSame('原始商品名', $d['data']['product_title']);
    }

    public function testRedeliverOwnership(): void
    {
        [$m, $p] = $this->ctx();
        $order = $this->order($m, $p, 1);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);
        $other = $this->makeMerchant();

        $resp = $this->call('POST', '/merchant/orders/' . $order->id . '/redeliver', [], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $resp->getCode());
    }
}
