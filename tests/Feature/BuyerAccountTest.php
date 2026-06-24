<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Order;
use app\model\Product;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 买家账号(可选):注册/登录/me + 我的订单(按邮箱关联,含此前游客单)。
 */
class BuyerAccountTest extends TestCase
{
    private function reg(string $email = 'buyer@x.com', string $pw = 'pass123'): array
    {
        return $this->callJson('POST', '/buyer/register', ['email' => $email, 'password' => $pw]);
    }

    private function makeOrder(int $mid, int $pid, string $email, ?int $buyerId = null): void
    {
        Order::create([
            'order_no'     => OrderNo::generate('OD'),
            'merchant_id'  => $mid,
            'product_id'   => $pid,
            'buyer_email'  => $email,
            'buyer_id'     => $buyerId,
            'quantity'     => 1,
            'unit_price'   => '10.00',
            'total_amount' => '10.00',
            'status'       => Order::STATUS_DELIVERED,
            'expire_at'    => date('Y-m-d H:i:s', time() + 3600),
        ]);
    }

    public function testRegisterLoginAndMe(): void
    {
        $r = $this->reg();
        $this->assertSame(0, $r['code']);
        $this->assertNotEmpty($r['data']['token']);
        $this->assertSame('buyer@x.com', $r['data']['buyer']['email']);
        $this->assertArrayNotHasKey('password', $r['data']['buyer'], '注册响应不得含密码哈希');

        $l = $this->callJson('POST', '/buyer/login', ['email' => 'buyer@x.com', 'password' => 'pass123']);
        $this->assertSame(0, $l['code']);
        $token = $l['data']['token'];

        $me = $this->callJson('GET', '/buyer/account/me', [], $this->bearer($token));
        $this->assertSame('buyer@x.com', $me['data']['buyer']['email']);
        $this->assertArrayNotHasKey('password', $me['data']['buyer']);
    }

    public function testDuplicateEmailRejected(): void
    {
        $this->assertSame(0, $this->reg()['code']);
        $this->assertNotSame(0, $this->reg()['code'], '同邮箱重复注册应被拒');
    }

    public function testValidationRejectsBadEmailAndShortPassword(): void
    {
        $this->assertNotSame(0, $this->callJson('POST', '/buyer/register', ['email' => 'not-an-email', 'password' => 'pass123'])['code']);
        $this->assertNotSame(0, $this->callJson('POST', '/buyer/register', ['email' => 'a@b.com', 'password' => '123'])['code']);
    }

    public function testLoginWrongPasswordRejected(): void
    {
        $this->reg();
        $this->assertNotSame(0, $this->callJson('POST', '/buyer/login', ['email' => 'buyer@x.com', 'password' => 'WRONG'])['code']);
    }

    public function testProtectedRoutesRequireAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/buyer/account/me')->getCode());
        $this->assertSame(401, $this->call('GET', '/buyer/account/orders')->getCode());
    }

    /** 安全:我的订单按 buyer_id 绑定,不按邮箱认领——注册他人邮箱看不到其游客单 */
    public function testMyOrdersBoundByBuyerIdNotEmail(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);

        $reg     = $this->reg('buyer@x.com', 'pass123');
        $buyerId = (int) $reg['data']['buyer']['id'];
        $token   = $reg['data']['token'];

        // 2 单绑定到本账号(登录态下单)
        $this->makeOrder((int) $m->id, (int) $p->id, 'buyer@x.com', $buyerId);
        $this->makeOrder((int) $m->id, (int) $p->id, 'gift@x.com', $buyerId); // 不同收货邮箱、同账号
        // 同邮箱的**游客单**(buyer_id=null):绝不能因邮箱相同而出现(否则=注册他人邮箱即可看其卡密)
        $this->makeOrder((int) $m->id, (int) $p->id, 'buyer@x.com', null);

        $list = $this->callJson('GET', '/buyer/account/orders', [], $this->bearer($token));
        $this->assertSame(0, $list['code']);
        $this->assertSame(2, $list['data']['total'], '只看到绑定本账号(buyer_id)的 2 单,不按邮箱认领游客单/他人单');
    }

    /** 带买家令牌下单 → 自动绑定账号并出现在我的订单(游客单不带令牌则不绑定) */
    public function testLoggedInOrderBindsToAccount(): void
    {
        $m = $this->makeMerchant();
        // 非码池类(知识)商品,免卡库存即可下单
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'k', 'price' => '5.00', 'status' => Product::STATUS_ON, 'goods_type' => 2, 'delivery_message' => 'hello', 'stock' => 999]);
        $token = $this->reg('buyer@x.com', 'pass123')['data']['token'];

        $r = $this->callJson('POST', '/buyer/order', ['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com'], $this->bearer($token));
        $this->assertSame(0, $r['code']);

        $list = $this->callJson('GET', '/buyer/account/orders', [], $this->bearer($token));
        $this->assertSame(1, $list['data']['total'], '登录态下单应绑定账号并出现在我的订单');
    }
}
