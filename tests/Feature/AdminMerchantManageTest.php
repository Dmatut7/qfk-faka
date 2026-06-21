<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Merchant;
use tests\TestCase;

/**
 * 平台商户管理:审核/冻结/解冻/改抽佣/重置密码/搜索 (T8.1)。
 */
class AdminMerchantManageTest extends TestCase
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

    public function testApprovePendingMerchant(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_PENDING]);
        $r = $this->callJson('POST', '/admin/merchants/' . $m->id . '/approve', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(Merchant::STATUS_ACTIVE, Merchant::find($m->id)->status);
    }

    public function testApproveNonPendingRejected(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $r = $this->callJson('POST', '/admin/merchants/' . $m->id . '/approve', [], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testFreezeRevokesTokensAndBlocksLogin(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $mToken = $this->merchantToken((int) $m->id);
        // 冻结前可访问
        $this->assertSame(200, $this->call('GET', '/merchant/me', [], $this->bearer($mToken))->getCode());

        $this->callJson('POST', '/admin/merchants/' . $m->id . '/freeze', [], $this->hdr());
        $this->assertSame(Merchant::STATUS_FROZEN, Merchant::find($m->id)->status);
        // 冻结后原 token 失效
        $this->assertSame(401, $this->call('GET', '/merchant/me', [], $this->bearer($mToken))->getCode());
    }

    public function testUnfreeze(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_FROZEN]);
        $this->callJson('POST', '/admin/merchants/' . $m->id . '/unfreeze', [], $this->hdr());
        $this->assertSame(Merchant::STATUS_ACTIVE, Merchant::find($m->id)->status);
    }

    public function testSetCommission(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/admin/merchants/' . $m->id . '/commission', ['commission_rate' => '0.1500'], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame('0.1500', Merchant::find($m->id)->commission_rate);
    }

    public function testSetCommissionOutOfRangeRejected(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/admin/merchants/' . $m->id . '/commission', ['commission_rate' => '1.5'], $this->hdr());
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }

    public function testResetPassword(): void
    {
        $m = $this->makeMerchant(['password' => password_hash('oldpass', PASSWORD_BCRYPT)]);
        $this->callJson('POST', '/admin/merchants/' . $m->id . '/reset-password', ['new_password' => 'brandnew1'], $this->hdr());

        $this->assertTrue(password_verify('brandnew1', Merchant::find($m->id)->password));
        $this->assertFalse(password_verify('oldpass', Merchant::find($m->id)->password));
    }

    public function testSearchByKeyword(): void
    {
        $m = $this->makeMerchant(['store_name' => '独特店名XYZ']);
        $this->makeMerchant(['store_name' => '普通店']);
        $r = $this->callJson('GET', '/admin/merchants', ['keyword' => 'XYZ'], $this->hdr());
        $this->assertSame(1, $r['data']['total']);
        $this->assertSame((int) $m->id, $r['data']['items'][0]['id']);
    }

    public function testRequiresAdminAuth(): void
    {
        $m = $this->makeMerchant();
        $this->assertSame(401, $this->call('POST', '/admin/merchants/' . $m->id . '/freeze')->getCode());
    }
}
