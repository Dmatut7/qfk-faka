<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Admin;
use tests\TestCase;

/**
 * 平台管理员登录/登出 + AdminAuth 中间件 (T3.2)。
 */
class AdminAuthTest extends TestCase
{
    private function admin(string $pw = 'secret', int $status = Admin::STATUS_ENABLED): Admin
    {
        return Admin::create([
            'username' => 'adm_' . uniqid(),
            'password' => password_hash($pw, PASSWORD_BCRYPT),
            'status'   => $status,
        ]);
    }

    public function testLoginSuccessReturnsToken(): void
    {
        $a = $this->admin('pw123');
        $body = $this->callJson('POST', '/admin/login', ['username' => $a->username, 'password' => 'pw123']);

        $this->assertSame(0, $body['code']);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $body['data']['token']);
        $this->assertSame($a->username, $body['data']['admin']['username']);
        $this->assertArrayNotHasKey('password', $body['data']['admin']);
    }

    public function testLoginWrongPassword(): void
    {
        $a = $this->admin('right');
        $resp = $this->call('POST', '/admin/login', ['username' => $a->username, 'password' => 'wrong']);
        $this->assertSame(401, $resp->getCode());
        $this->assertSame(Code::UNAUTHORIZED, json_decode($resp->getContent(), true)['code']);
    }

    public function testLoginMissingParamsIs422(): void
    {
        $resp = $this->call('POST', '/admin/login', ['username' => 'x']);
        $this->assertSame(422, $resp->getCode());
        $this->assertSame(Code::PARAM_ERROR, json_decode($resp->getContent(), true)['code']);
    }

    public function testDisabledAdminCannotLogin(): void
    {
        $a = $this->admin('pw', Admin::STATUS_DISABLED);
        $resp = $this->call('POST', '/admin/login', ['username' => $a->username, 'password' => 'pw']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testProtectedRouteRequiresToken(): void
    {
        $resp = $this->call('GET', '/admin/me');
        $this->assertSame(401, $resp->getCode());
    }

    public function testProtectedRouteWithToken(): void
    {
        $a = $this->admin('pw');
        $login = $this->callJson('POST', '/admin/login', ['username' => $a->username, 'password' => 'pw']);
        $token = $login['data']['token'];

        $body = $this->callJson('GET', '/admin/me', [], $this->bearer($token));
        $this->assertSame(0, $body['code']);
        $this->assertSame((int) $a->id, $body['data']['id']);
    }

    public function testLogoutInvalidatesToken(): void
    {
        $a = $this->admin('pw');
        $token = $this->callJson('POST', '/admin/login', ['username' => $a->username, 'password' => 'pw'])['data']['token'];

        // 登出
        $out = $this->callJson('POST', '/admin/logout', [], $this->bearer($token));
        $this->assertSame(0, $out['code']);

        // 同 token 再访问受保护路由 → 401
        $resp = $this->call('GET', '/admin/me', [], $this->bearer($token));
        $this->assertSame(401, $resp->getCode());
    }

    public function testBadTokenRejected(): void
    {
        $resp = $this->call('GET', '/admin/me', [], $this->bearer(str_repeat('0', 64)));
        $this->assertSame(401, $resp->getCode());
    }
}
