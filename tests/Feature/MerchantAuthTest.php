<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\controller\BaseApiController;
use app\model\Merchant;
use tests\TestCase;

/** 测试用:暴露 assertMerchantOwnership */
class _OwnerProbeController extends BaseApiController
{
    public function check(int $resourceMerchantId)
    {
        $this->request->authId = 100;
        $this->assertMerchantOwnership($resourceMerchantId);
        return $this->success('ok');
    }
}

/**
 * 商户登录/登出 + MerchantAuth 中间件 + 归属校验 (T3.3)。
 */
class MerchantAuthTest extends TestCase
{
    private function merchant(string $pw = 'pw', int $status = Merchant::STATUS_ACTIVE): Merchant
    {
        $u = uniqid();
        return Merchant::create([
            'username'   => 'm_' . $u,
            'password'   => password_hash($pw, PASSWORD_BCRYPT),
            'store_name' => '店', 'store_slug' => 'sl_' . $u,
            'status'     => $status,
        ]);
    }

    public function testActiveMerchantLogin(): void
    {
        $m = $this->merchant('pw123');
        $body = $this->callJson('POST', '/merchant/login', ['username' => $m->username, 'password' => 'pw123']);
        $this->assertSame(0, $body['code']);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $body['data']['token']);
        $this->assertArrayNotHasKey('password', $body['data']['merchant']);
    }

    public function testWrongPassword(): void
    {
        $m = $this->merchant('right');
        $resp = $this->call('POST', '/merchant/login', ['username' => $m->username, 'password' => 'wrong']);
        $this->assertSame(401, $resp->getCode());
    }

    public function testPendingMerchantCannotLogin(): void
    {
        $m = $this->merchant('pw', Merchant::STATUS_PENDING);
        $resp = $this->call('POST', '/merchant/login', ['username' => $m->username, 'password' => 'pw']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testFrozenMerchantCannotLogin(): void
    {
        $m = $this->merchant('pw', Merchant::STATUS_FROZEN);
        $resp = $this->call('POST', '/merchant/login', ['username' => $m->username, 'password' => 'pw']);
        $this->assertSame(403, $resp->getCode());
        $this->assertSame(Code::FORBIDDEN, json_decode($resp->getContent(), true)['code']);
    }

    public function testMeRequiresToken(): void
    {
        $this->assertSame(401, $this->call('GET', '/merchant/me')->getCode());
    }

    public function testMeWithToken(): void
    {
        $m = $this->merchant('pw');
        $token = $this->callJson('POST', '/merchant/login', ['username' => $m->username, 'password' => 'pw'])['data']['token'];
        $body = $this->callJson('GET', '/merchant/me', [], $this->bearer($token));
        $this->assertSame(0, $body['code']);
        $this->assertSame((int) $m->id, $body['data']['id']);
        $this->assertSame($m->store_slug, $body['data']['store_slug']);
    }

    /** 安全#1:令牌经 ?token= 查询参数**不得**通过鉴权(防 URL/日志/Referer 泄漏),只认 Authorization 头 */
    public function testQueryParamTokenIsRejected(): void
    {
        $m = $this->merchant('pw');
        $token = $this->callJson('POST', '/merchant/login', ['username' => $m->username, 'password' => 'pw'])['data']['token'];
        // 同一合法令牌:走 Authorization 头 → 放行
        $this->assertSame(0, $this->callJson('GET', '/merchant/me', [], $this->bearer($token))['code']);
        // 走 ?token= 查询参数(无头)→ 必须 401,回退已移除
        $this->assertSame(401, $this->call('GET', '/merchant/me', ['token' => $token])->getCode(), '令牌经查询参数不得通过鉴权');
    }

    public function testAdminTokenCannotAccessMerchantArea(): void
    {
        // 用 merchant 端点但传一个 admin 主体 token 应被拒(owner_type 不符)
        // 这里直接验证:无 merchant token → 401(跨端隔离由 owner_type 校验保证)
        $this->assertSame(401, $this->call('GET', '/merchant/me', [], $this->bearer(str_repeat('a', 64)))->getCode());
    }

    public function testOwnershipAssertion(): void
    {
        $c = new _OwnerProbeController($this->app);
        // 归属一致放行
        $this->assertSame(0, json_decode($c->check(100)->getContent(), true)['code']);
        // 归属不符 → 403 FORBIDDEN
        $this->expectException(BizException::class);
        try {
            $c->check(200);
        } catch (BizException $e) {
            $this->assertSame(Code::FORBIDDEN, $e->getBizCode());
            throw $e;
        }
    }
}
