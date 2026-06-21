<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Merchant;
use tests\TestCase;

/**
 * 商户自助注册 POST /merchant/register(公开)。
 * 落库 pending + store_slug 自动生成 + 重复用户名拒 + 弱密码拒 + 注册后未审核不可登录/上架。
 */
class MerchantRegisterTest extends TestCase
{
    private function payload(array $override = []): array
    {
        $u = uniqid('reg');
        return array_merge([
            'username'   => $u,
            'password'   => 'secret123',
            'store_name' => '我的小店',
            'email'      => $u . '@example.com',
        ], $override);
    }

    public function testRegisterSucceedsAsPending(): void
    {
        $p = $this->payload();
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(0, $r['code']);
        $this->assertArrayHasKey('merchant_id', $r['data']);
        $this->assertSame(Merchant::STATUS_PENDING, $r['data']['status']);

        $m = Merchant::find((int) $r['data']['merchant_id']);
        $this->assertNotNull($m);
        $this->assertSame($p['username'], $m->username);
        $this->assertSame($p['store_name'], $m->store_name);
        $this->assertSame(Merchant::STATUS_PENDING, (int) $m->status);
        // store_slug 自动生成且非空
        $this->assertNotEmpty($m->store_slug);
        // 资金/认证字段归零
        $this->assertSame(0, \app\util\Money::cmp((string) $m->balance, '0'));
        $this->assertSame(0, \app\util\Money::cmp((string) $m->frozen_balance, '0'));
        $this->assertSame(0, \app\util\Money::cmp((string) $m->deposit, '0'));
        $this->assertSame(0, (int) $m->verified);
        // 密码 bcrypt 落库,可校验
        $this->assertTrue(password_verify($p['password'], (string) $m->password));
    }

    public function testDuplicateUsernameRejected(): void
    {
        $p = $this->payload();
        $r1 = $this->callJson('POST', '/merchant/register', $p);
        $this->assertSame(0, $r1['code']);

        // 同名再注册(改邮箱避免邮箱唯一冲突干扰),应被拒
        $r2 = $this->callJson('POST', '/merchant/register', $this->payload([
            'username' => $p['username'],
        ]));
        $this->assertSame(Code::STATE_INVALID, $r2['code']);
        // 仍只有一条该用户名记录
        $this->assertSame(1, Merchant::where('username', $p['username'])->count());
    }

    public function testWeakPasswordRejected(): void
    {
        $r = $this->call('POST', '/merchant/register', $this->payload(['password' => '123']));
        $this->assertSame(422, $r->getCode());
        $body = json_decode($r->getContent(), true);
        $this->assertSame(Code::PARAM_ERROR, $body['code']);
    }

    public function testInvalidEmailRejected(): void
    {
        $r = $this->call('POST', '/merchant/register', $this->payload(['email' => 'not-an-email']));
        $this->assertSame(422, $r->getCode());
        $this->assertSame(Code::PARAM_ERROR, json_decode($r->getContent(), true)['code']);
    }

    public function testMissingStoreNameRejected(): void
    {
        $p = $this->payload();
        unset($p['store_name']);
        $r = $this->call('POST', '/merchant/register', $p);
        $this->assertSame(422, $r->getCode());
    }

    public function testNoInviteCodeRegistersWhenNotRequired(): void
    {
        // 默认 registration_require_invite 未设置(不要求):不传邀请码可注册成功
        $r = $this->callJson('POST', '/merchant/register', $this->payload());
        $this->assertSame(0, $r['code']);
        $this->assertSame(Merchant::STATUS_PENDING, $r['data']['status']);
    }

    public function testInvalidInviteCodeRejectedEvenWhenNotRequired(): void
    {
        // 不要求邀请码时,若传了邀请码也会被校验:无效码应被拒,且不建户
        $p = $this->payload(['invite_code' => 'WHATEVERX']);
        $r = $this->callJson('POST', '/merchant/register', $p);
        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
    }

    public function testRegisteredMerchantCannotLoginUntilApproved(): void
    {
        $p = $this->payload();
        $reg = $this->callJson('POST', '/merchant/register', $p);
        $this->assertSame(0, $reg['code']);

        // 未审核:登录被拒(403 商户待审核)
        $login = $this->call('POST', '/merchant/login', [
            'username' => $p['username'],
            'password' => $p['password'],
        ]);
        $this->assertSame(403, $login->getCode());
        $this->assertSame(Code::FORBIDDEN, json_decode($login->getContent(), true)['code']);

        // 审核通过后即可登录
        Merchant::where('id', $reg['data']['merchant_id'])->update(['status' => Merchant::STATUS_ACTIVE]);
        $ok = $this->callJson('POST', '/merchant/login', [
            'username' => $p['username'],
            'password' => $p['password'],
        ]);
        $this->assertSame(0, $ok['code']);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $ok['data']['token']);
    }

    public function testPendingMerchantCannotPublishProduct(): void
    {
        // 注册后未审核 → 即便拿到 token 也无法访问商户区(状态非 active)。
        $p = $this->payload();
        $reg = $this->callJson('POST', '/merchant/register', $p);
        $mid = (int) $reg['data']['merchant_id'];

        // 为待审核商户直接签发 token(模拟"拿到了 token"),上架商品应被中间件拦截。
        $token = $this->merchantToken($mid);
        $resp = $this->call('POST', '/merchant/products', [
            'title' => '不该成功的商品',
            'price' => '9.90',
        ], $this->bearer($token));

        // MerchantAuth 对非 active 商户拒绝(401/403);确保未创建商品。
        $this->assertContains($resp->getCode(), [401, 403]);
        $this->assertSame(0, \app\model\Product::where('merchant_id', $mid)->count());
    }
}
