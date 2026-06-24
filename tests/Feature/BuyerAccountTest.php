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

    private function makeOrder(int $mid, int $pid, string $email): void
    {
        Order::create([
            'order_no'     => OrderNo::generate('OD'),
            'merchant_id'  => $mid,
            'product_id'   => $pid,
            'buyer_email'  => $email,
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

    public function testMyOrdersByEmailIncludingGuestCaseInsensitive(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        // 注册前就存在的游客单(其中一单邮箱大写,验证大小写不敏感关联)
        $this->makeOrder((int) $m->id, (int) $p->id, 'BUYER@x.com');
        $this->makeOrder((int) $m->id, (int) $p->id, 'buyer@x.com');
        $this->makeOrder((int) $m->id, (int) $p->id, 'other@x.com'); // 他人单,不应出现

        $token = $this->reg('buyer@x.com', 'pass123')['data']['token'];
        $list = $this->callJson('GET', '/buyer/account/orders', [], $this->bearer($token));
        $this->assertSame(0, $list['code']);
        $this->assertSame(2, $list['data']['total'], '只看到本邮箱(大小写不敏感)的 2 单');
    }
}
