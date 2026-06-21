<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\InviteCode;
use app\model\Merchant;
use app\service\SettingService;
use tests\TestCase;

/**
 * 注册邀请码:后台 CRUD(生成/列表/停用/删除)+ 注册闸门
 * (require=1 必填且必须有效;有效码注册成功且 used_count++;用尽/停用的码被拒;require=0 无码放行)。
 */
class InviteCodeTest extends TestCase
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

    private function requireInvite(bool $on): void
    {
        (new SettingService())->set('registration_require_invite', $on ? '1' : '0');
    }

    private function regPayload(array $override = []): array
    {
        $u = uniqid('inv');
        return array_merge([
            'username'   => $u,
            'password'   => 'secret123',
            'store_name' => '邀请码小店',
            'email'      => $u . '@example.com',
        ], $override);
    }

    // ---------- 后台 CRUD ----------

    public function testGenerateDefaultsToOneCode(): void
    {
        $r = $this->callJson('POST', '/admin/invite-codes', ['note' => '默认一个'], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(1, $r['data']['count']);
        $this->assertCount(1, $r['data']['items']);

        $item = $r['data']['items'][0];
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $item['code']);
        $this->assertSame(InviteCode::STATUS_ENABLED, $item['status']);
        $this->assertSame(1, $item['max_uses']);
        $this->assertSame(0, $item['used_count']);
        $this->assertSame('默认一个', $item['note']);

        $row = InviteCode::find($item['id']);
        $this->assertNotNull($row);
        $this->assertSame('默认一个', $row->note);
    }

    public function testGenerateBatchProducesUniqueCodes(): void
    {
        $r = $this->callJson('POST', '/admin/invite-codes', ['count' => 5, 'max_uses' => 3], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(5, $r['data']['count']);

        $codes = array_column($r['data']['items'], 'code');
        $this->assertCount(5, $codes);
        // 全部唯一
        $this->assertSame(5, count(array_unique($codes)));
        foreach ($r['data']['items'] as $item) {
            $this->assertSame(3, $item['max_uses']);
        }
    }

    public function testListReturnsCodes(): void
    {
        $this->callJson('POST', '/admin/invite-codes', ['count' => 2], $this->hdr());

        $r = $this->callJson('GET', '/admin/invite-codes', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertArrayHasKey('items', $r['data']);
        $this->assertGreaterThanOrEqual(2, count($r['data']['items']));
    }

    public function testDisableCode(): void
    {
        $gen  = $this->callJson('POST', '/admin/invite-codes', [], $this->hdr());
        $id   = $gen['data']['items'][0]['id'];

        $r = $this->callJson('POST', '/admin/invite-codes/' . $id . '/disable', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(InviteCode::STATUS_DISABLED, $r['data']['status']);
        $this->assertSame(InviteCode::STATUS_DISABLED, (int) InviteCode::find($id)->status);
    }

    public function testDeleteUnusedCode(): void
    {
        $gen = $this->callJson('POST', '/admin/invite-codes', [], $this->hdr());
        $id  = $gen['data']['items'][0]['id'];

        $r = $this->callJson('POST', '/admin/invite-codes/' . $id . '/delete', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertNull(InviteCode::find($id));
    }

    public function testCannotDeleteUsedCode(): void
    {
        $c = InviteCode::create([
            'code' => 'USEDCODE', 'status' => 1, 'max_uses' => 1, 'used_count' => 1,
        ]);

        $r = $this->callJson('POST', '/admin/invite-codes/' . $c->id . '/delete', [], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
        // 仍在
        $this->assertNotNull(InviteCode::find($c->id));
    }

    public function testCrudRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/invite-codes')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/invite-codes')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/invite-codes/1/disable')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/invite-codes/1/delete')->getCode());
    }

    // ---------- 注册闸门 ----------

    public function testRequireInviteRejectsRegistrationWithoutCode(): void
    {
        $this->requireInvite(true);
        $p = $this->regPayload();
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
    }

    public function testRequireInviteRegistersWithValidCodeAndIncrementsUsedCount(): void
    {
        $this->requireInvite(true);
        $c = InviteCode::create([
            'code' => 'VALID001', 'status' => 1, 'max_uses' => 1, 'used_count' => 0,
        ]);

        $p = $this->regPayload(['invite_code' => 'VALID001']);
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(0, $r['code']);
        $this->assertSame(Merchant::STATUS_PENDING, $r['data']['status']);
        $this->assertSame(1, Merchant::where('username', $p['username'])->count());

        // used_count++
        $this->assertSame(1, (int) InviteCode::find($c->id)->used_count);
    }

    public function testRequireInviteRejectsExhaustedCode(): void
    {
        $this->requireInvite(true);
        $c = InviteCode::create([
            'code' => 'EXHAUST1', 'status' => 1, 'max_uses' => 1, 'used_count' => 1,
        ]);

        $p = $this->regPayload(['invite_code' => 'EXHAUST1']);
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
        // 用量未被推高
        $this->assertSame(1, (int) InviteCode::find($c->id)->used_count);
    }

    public function testRequireInviteRejectsDisabledCode(): void
    {
        $this->requireInvite(true);
        $c = InviteCode::create([
            'code' => 'DISABLE1', 'status' => 0, 'max_uses' => 1, 'used_count' => 0,
        ]);

        $p = $this->regPayload(['invite_code' => 'DISABLE1']);
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
        $this->assertSame(0, (int) InviteCode::find($c->id)->used_count);
    }

    public function testRequireInviteRejectsUnknownCode(): void
    {
        $this->requireInvite(true);
        $p = $this->regPayload(['invite_code' => 'NOSUCHXX']);
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
    }

    public function testMultiUseCodeUsableUntilExhausted(): void
    {
        $this->requireInvite(true);
        $c = InviteCode::create([
            'code' => 'MULTI002', 'status' => 1, 'max_uses' => 2, 'used_count' => 0,
        ]);

        $r1 = $this->callJson('POST', '/merchant/register', $this->regPayload(['invite_code' => 'MULTI002']));
        $this->assertSame(0, $r1['code']);
        $r2 = $this->callJson('POST', '/merchant/register', $this->regPayload(['invite_code' => 'MULTI002']));
        $this->assertSame(0, $r2['code']);
        // 第三次:已用尽
        $r3 = $this->callJson('POST', '/merchant/register', $this->regPayload(['invite_code' => 'MULTI002']));
        $this->assertSame(Code::STATE_INVALID, $r3['code']);

        $this->assertSame(2, (int) InviteCode::find($c->id)->used_count);
    }

    public function testUnlimitedCodeNeverExhausts(): void
    {
        $this->requireInvite(true);
        $c = InviteCode::create([
            'code' => 'UNLIM003', 'status' => 1, 'max_uses' => 0, 'used_count' => 0,
        ]);

        for ($i = 0; $i < 3; $i++) {
            $r = $this->callJson('POST', '/merchant/register', $this->regPayload(['invite_code' => 'UNLIM003']));
            $this->assertSame(0, $r['code']);
        }
        $this->assertSame(3, (int) InviteCode::find($c->id)->used_count);
    }

    public function testNoInviteRequiredAllowsRegistrationWithoutCode(): void
    {
        $this->requireInvite(false);
        $p = $this->regPayload();
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(0, $r['code']);
        $this->assertSame(Merchant::STATUS_PENDING, $r['data']['status']);
        $this->assertSame(1, Merchant::where('username', $p['username'])->count());
    }

    public function testNoInviteRequiredButProvidedCodeStillRedeemed(): void
    {
        $this->requireInvite(false);
        $c = InviteCode::create([
            'code' => 'OPT00001', 'status' => 1, 'max_uses' => 1, 'used_count' => 0,
        ]);

        $r = $this->callJson('POST', '/merchant/register', $this->regPayload(['invite_code' => 'OPT00001']));
        $this->assertSame(0, $r['code']);
        // 传了有效码即便不要求也会被核销
        $this->assertSame(1, (int) InviteCode::find($c->id)->used_count);
    }

    public function testNoInviteRequiredInvalidProvidedCodeRejected(): void
    {
        $this->requireInvite(false);
        $p = $this->regPayload(['invite_code' => 'BADCODE9']);
        $r = $this->callJson('POST', '/merchant/register', $p);

        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertSame(0, Merchant::where('username', $p['username'])->count());
    }
}
