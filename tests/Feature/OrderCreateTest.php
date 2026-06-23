<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Order;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;

/**
 * 下单 + 预占卡密(单线程正确性,T5.2 TDD)。
 * 并发安全见 OrderConcurrencyTest (T5.3)。
 */
class OrderCreateTest extends TestCase
{
    private OrderService $svc;
    private $m;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new OrderService();
        $this->m = $this->makeMerchant();
    }

    private function product(array $o = []): Product
    {
        return Product::create(array_merge([
            'merchant_id' => $this->m->id, 'title' => 'card', 'price' => '9.99',
            'status' => Product::STATUS_ON, 'stock' => 0,
        ], $o));
    }

    private function addCards(Product $p, int $n): void
    {
        for ($i = 0; $i < $n; $i++) {
            $s = 'C-' . $p->id . '-' . $i . '-' . uniqid();
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => $n]);
    }

    public function testCreateOrderReservesCards(): void
    {
        $p = $this->product();
        $this->addCards($p, 5);

        $order = $this->svc->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);

        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame('9.99', $order->unit_price);
        $this->assertSame('19.98', $order->total_amount); // 9.99 * 2,bcmath
        $this->assertNotEmpty($order->order_no);
        $this->assertNotEmpty($order->expire_at);

        // 恰好 2 张卡被锁定且归属本单
        $locked = Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count();
        $this->assertSame(2, $locked);
        // 仍有 3 张未售
        $this->assertSame(3, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        // stock 缓存同步递减
        $this->assertSame(3, Product::find($p->id)->stock);
    }

    public function testExpireAtAboutFifteenMinutes(): void
    {
        $p = $this->product();
        $this->addCards($p, 1);
        $order = $this->svc->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $delta = strtotime($order->expire_at) - time();
        $this->assertGreaterThan(840, $delta);   // > 14min
        $this->assertLessThanOrEqual(900, $delta); // <= 15min
    }

    public function testInsufficientStock(): void
    {
        $p = $this->product();
        $this->addCards($p, 1);
        try {
            $this->svc->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
            $this->fail('应抛库存不足');
        } catch (BizException $e) {
            $this->assertSame(Code::STOCK_NOT_ENOUGH, $e->getBizCode());
        }
        // 失败不得残留锁定卡
        $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        $this->assertSame(0, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count());
    }

    public function testQuantityHardUpperBound(): void
    {
        // 知识类(无 stock 约束)+ max_buy=0(不限购):仍不允许异常巨量
        $kp = Product::create([
            'merchant_id' => $this->m->id, 'title' => '课', 'price' => '1.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE, 'max_buy' => 0, 'stock' => 0,
        ]);
        try {
            $this->svc->create(['product_id' => $kp->id, 'quantity' => 10000, 'buyer_email' => 'b@x.com']);
            $this->fail('超大数量应被拒');
        } catch (BizException $e) {
            $this->assertSame(Code::BUY_LIMIT, $e->getBizCode());
        }
    }

    public function testFrozenMerchantProductCannotBeOrdered(): void
    {
        $p = $this->product();
        $this->addCards($p, 5);
        // 商户被平台冻结后,其在售商品也不可再下单(避免向已停业商户继续成交)
        \app\model\Merchant::where('id', $this->m->id)->update(['status' => \app\model\Merchant::STATUS_FROZEN]);
        try {
            $this->svc->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
            $this->fail('冻结商户商品应拒绝下单');
        } catch (BizException $e) {
            $this->assertSame(Code::PRODUCT_OFF, $e->getBizCode());
        }
        // 拒单不得残留锁定卡
        $this->assertSame(0, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count());
    }

    public function testExceedMaxBuy(): void
    {
        $p = $this->product(['max_buy' => 3]);
        $this->addCards($p, 10);
        $this->expectExceptionCode(0); // BizException code 默认 0;用 getBizCode 断言
        try {
            $this->svc->create(['product_id' => $p->id, 'quantity' => 5, 'buyer_email' => 'b@x.com']);
            $this->fail('应超限购');
        } catch (BizException $e) {
            $this->assertSame(Code::BUY_LIMIT, $e->getBizCode());
            throw $e;
        }
    }

    public function testBelowMinBuy(): void
    {
        $p = $this->product(['min_buy' => 2]);
        $this->addCards($p, 10);
        try {
            $this->svc->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
            $this->fail('应低于起购');
        } catch (BizException $e) {
            $this->assertSame(Code::BUY_LIMIT, $e->getBizCode());
        }
    }

    public function testOffSaleProductRejected(): void
    {
        $p = $this->product(['status' => Product::STATUS_OFF]);
        $this->addCards($p, 5);
        try {
            $this->svc->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
            $this->fail('应下架拒绝');
        } catch (BizException $e) {
            $this->assertSame(Code::PRODUCT_OFF, $e->getBizCode());
        }
    }

    public function testAmountUsesBcmath(): void
    {
        $p = $this->product(['price' => '0.10']);
        $this->addCards($p, 5);
        $order = $this->svc->create(['product_id' => $p->id, 'quantity' => 3, 'buyer_email' => 'b@x.com']);
        $this->assertSame('0.30', $order->total_amount); // 浮点会得 0.30000000000000004
    }
}
