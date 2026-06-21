<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Admin;
use app\model\Merchant;
use tests\TestCase;

/**
 * 平台建商户 + 商户改密 (T3.4)。
 */
class MerchantManageTest extends TestCase
{
    private function adminToken(): string
    {
        $a = Admin::create(['username' => 'adm_' . uniqid(), 'password' => password_hash('pw', PASSWORD_BCRYPT)]);
        return $this->callJson('POST', '/admin/login', ['username' => $a->username, 'password' => 'pw'])['data']['token'];
    }

    private function newMerchantPayload(array $o = []): array
    {
        $u = uniqid();
        return array_merge([
            'username'   => 'mc_' . $u,
            'password'   => 'pw123456',
            'store_name' => '新店',
            'store_slug' => 'shop' . substr($u, -6),
        ], $o);
    }

    public function testAdminCreatesMerchantWhoCanLogin(): void
    {
        $token = $this->adminToken();
        $payload = $this->newMerchantPayload();

        $created = $this->callJson('POST', '/admin/merchants', $payload, $this->bearer($token));
        $this->assertSame(0, $created['code']);
        $this->assertSame(Merchant::STATUS_ACTIVE, $created['data']['status']);

        // 新商户可直接登录
        $login = $this->callJson('POST', '/merchant/login', ['username' => $payload['username'], 'password' => $payload['password']]);
        $this->assertSame(0, $login['code']);
    }

    public function testCreateMerchantRequiresAdminAuth(): void
    {
        $resp = $this->call('POST', '/admin/merchants', $this->newMerchantPayload());
        $this->assertSame(401, $resp->getCode());
    }

    public function testDuplicateUsernameRejected(): void
    {
        $token = $this->adminToken();
        $payload = $this->newMerchantPayload();
        $this->callJson('POST', '/admin/merchants', $payload, $this->bearer($token));

        $dup = $this->callJson('POST', '/admin/merchants', $this->newMerchantPayload(['username' => $payload['username']]), $this->bearer($token));
        $this->assertSame(Code::STATE_INVALID, $dup['code']);
    }

    public function testWeakPasswordRejected(): void
    {
        $token = $this->adminToken();
        $resp = $this->call('POST', '/admin/merchants', $this->newMerchantPayload(['password' => '123']), $this->bearer($token));
        $this->assertSame(422, $resp->getCode());
    }

    public function testMerchantChangePassword(): void
    {
        // 建商户并登录
        $token = $this->adminToken();
        $payload = $this->newMerchantPayload(['password' => 'oldpass1']);
        $this->callJson('POST', '/admin/merchants', $payload, $this->bearer($token));
        $mToken = $this->callJson('POST', '/merchant/login', ['username' => $payload['username'], 'password' => 'oldpass1'])['data']['token'];

        // 改密
        $chg = $this->callJson('POST', '/merchant/change-password', ['old_password' => 'oldpass1', 'new_password' => 'newpass1'], $this->bearer($mToken));
        $this->assertSame(0, $chg['code']);

        // 旧 token 失效(改密吊销全部令牌)
        $this->assertSame(401, $this->call('GET', '/merchant/me', [], $this->bearer($mToken))->getCode());

        // 旧密码失效、新密码可登录
        $this->assertSame(Code::UNAUTHORIZED, json_decode($this->call('POST', '/merchant/login', ['username' => $payload['username'], 'password' => 'oldpass1'])->getContent(), true)['code']);
        $this->assertSame(0, $this->callJson('POST', '/merchant/login', ['username' => $payload['username'], 'password' => 'newpass1'])['code']);
    }

    public function testChangePasswordWrongOld(): void
    {
        $token = $this->adminToken();
        $payload = $this->newMerchantPayload(['password' => 'oldpass1']);
        $this->callJson('POST', '/admin/merchants', $payload, $this->bearer($token));
        $mToken = $this->callJson('POST', '/merchant/login', ['username' => $payload['username'], 'password' => 'oldpass1'])['data']['token'];

        $resp = $this->call('POST', '/merchant/change-password', ['old_password' => 'wrong', 'new_password' => 'newpass1'], $this->bearer($mToken));
        $this->assertSame(401, $resp->getCode());
    }
}
