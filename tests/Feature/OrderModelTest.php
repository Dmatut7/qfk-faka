<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Buyer;
use app\model\Card;
use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 买家 / 订单表与外键 (T2.5),含 cards.order_id → orders SET NULL。
 */
class OrderModelTest extends TestCase
{
    private array $ctx;

    protected function setUp(): void
    {
        parent::setUp();
        $u = uniqid();
        $m = Merchant::create(['username' => 'm_' . $u, 'password' => 'x', 'store_name' => 's', 'store_slug' => 'sl_' . $u]);
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'card', 'price' => '5.00']);
        $this->ctx = ['m' => $m, 'p' => $p];
    }

    private function order(array $override = []): Order
    {
        return Order::create(array_merge([
            'order_no'     => OrderNo::generate(),
            'merchant_id'  => $this->ctx['m']->id,
            'product_id'   => $this->ctx['p']->id,
            'buyer_email'  => 'b@example.com',
            'quantity'     => 1,
            'unit_price'   => '5.00',
            'total_amount' => '5.00',
            'expire_at'    => date('Y-m-d H:i:s', time() + 900),
        ], $override));
    }

    public function testBuyerUniqueEmail(): void
    {
        $email = 'buyer_' . uniqid() . '@x.com';
        Buyer::create(['email' => $email]);
        $this->expectException(\Exception::class);
        Buyer::create(['email' => $email]);
    }

    public function testOrderDefaultsAndGuestBuyer(): void
    {
        $o = $this->order();
        $found = Order::find($o->id);
        $this->assertSame(Order::STATUS_PENDING, $found->status);
        $this->assertNull($found->buyer_id, '游客下单 buyer_id 可空');
        $this->assertSame('5.00', $found->total_amount);
        $this->assertSame(1, $found->quantity);
    }

    public function testOrderNoUnique(): void
    {
        $o = $this->order();
        $this->expectException(\Exception::class);
        $this->order(['order_no' => $o->order_no]);
    }

    public function testCardOrderForeignKeySetNullOnOrderDelete(): void
    {
        $o = $this->order();
        $c = Card::create([
            'merchant_id' => $this->ctx['m']->id, 'product_id' => $this->ctx['p']->id,
            'secret' => 'S-' . uniqid(), 'secret_hash' => Card::hashSecret('S-' . uniqid()),
            'status' => Card::STATUS_LOCKED, 'order_id' => $o->id,
        ]);
        $this->assertSame($o->id, Card::find($c->id)->order_id);

        Order::destroy($o->id);

        $this->assertNull(Card::find($c->id)->order_id, '订单删除后卡 order_id 置空(SET NULL)');
    }

    public function testMerchantWithOrderCannotBeHardDeleted(): void
    {
        $this->order();
        $this->expectException(\Exception::class);
        Merchant::destroy($this->ctx['m']->id); // orders→merchants RESTRICT
    }
}
