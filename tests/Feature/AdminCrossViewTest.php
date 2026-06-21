<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use tests\TestCase;

/**
 * 平台跨商户只读视图(admin):跨商户订单 / 商品查询 (T8.5)。
 */
class AdminCrossViewTest extends TestCase
{
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

    private function makeProduct(Merchant $m, string $title): Product
    {
        return Product::create([
            'merchant_id' => $m->id,
            'title'       => $title,
            'price'       => '10.00',
            'status'      => Product::STATUS_ON,
        ]);
    }

    private function makeOrder(Merchant $m, Product $p): Order
    {
        $no = 'O' . uniqid();
        return Order::create([
            'order_no'     => $no,
            'merchant_id'  => $m->id,
            'product_id'   => $p->id,
            'buyer_email'  => 'b@x.com',
            'quantity'     => 1,
            'unit_price'   => '10.00',
            'total_amount' => '10.00',
            'status'       => Order::STATUS_PENDING,
            'expire_at'    => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    // ---------- 订单跨商户视图 ----------

    public function testOrdersSeeAllAcrossMerchants(): void
    {
        $mA = $this->makeMerchant();
        $mB = $this->makeMerchant();
        $this->makeOrder($mA, $this->makeProduct($mA, 'pa'));
        $this->makeOrder($mB, $this->makeProduct($mB, 'pb'));

        $r = $this->callJson('GET', '/admin/orders', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertGreaterThanOrEqual(2, $r['data']['total']);
    }

    public function testOrdersFilterByMerchant(): void
    {
        $mA = $this->makeMerchant();
        $mB = $this->makeMerchant();
        $this->makeOrder($mA, $this->makeProduct($mA, 'pa'));
        $this->makeOrder($mB, $this->makeProduct($mB, 'pb'));

        $r = $this->callJson('GET', '/admin/orders', ['merchant_id' => (int) $mA->id], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame((int) $mA->id, $r['data']['items'][0]['merchant_id']);
    }

    public function testOrdersFilterByOrderNo(): void
    {
        $mA = $this->makeMerchant();
        $o  = $this->makeOrder($mA, $this->makeProduct($mA, 'pa'));

        $r = $this->callJson('GET', '/admin/orders', ['order_no' => $o->order_no], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame($o->order_no, $r['data']['items'][0]['order_no']);
    }

    public function testOrdersRequireAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/orders')->getCode());
    }

    // ---------- 商品跨商户视图 ----------

    public function testProductsSeeAllAcrossMerchants(): void
    {
        $mA = $this->makeMerchant();
        $mB = $this->makeMerchant();
        $this->makeProduct($mA, '商品甲');
        $this->makeProduct($mB, '商品乙');

        $r = $this->callJson('GET', '/admin/products', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertGreaterThanOrEqual(2, $r['data']['total']);
    }

    public function testProductsFilterByMerchant(): void
    {
        $mA = $this->makeMerchant();
        $mB = $this->makeMerchant();
        $this->makeProduct($mA, '商品甲');
        $this->makeProduct($mB, '商品乙');

        $r = $this->callJson('GET', '/admin/products', ['merchant_id' => (int) $mA->id], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame((int) $mA->id, $r['data']['items'][0]['merchant_id']);
    }

    public function testProductsFilterByKeyword(): void
    {
        $mA = $this->makeMerchant();
        $this->makeProduct($mA, '独特商品XYZ');
        $this->makeProduct($mA, '普通商品');

        $r = $this->callJson('GET', '/admin/products', ['keyword' => 'XYZ'], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertStringContainsString('XYZ', $r['data']['items'][0]['title']);
    }

    public function testProductsFilterByStatus(): void
    {
        $mA = $this->makeMerchant();
        $this->makeProduct($mA, '在售品');
        Product::create([
            'merchant_id' => $mA->id,
            'title'       => '下架品',
            'price'       => '10.00',
            'status'      => Product::STATUS_OFF,
        ]);

        $r = $this->callJson('GET', '/admin/products', ['merchant_id' => (int) $mA->id, 'status' => Product::STATUS_OFF], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame(Product::STATUS_OFF, $r['data']['items'][0]['status']);
    }

    public function testProductsRequireAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/products')->getCode());
    }
}
