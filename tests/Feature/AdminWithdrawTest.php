<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Withdrawal;
use app\service\MerchantWalletService;
use app\util\Money;
use tests\TestCase;

/**
 * 平台提现审核 (T8.3, TDD, 资金守恒)。
 * approve:frozen-=A、status=PAID(总额 balance+frozen 减少 A)。
 * reject:frozen→balance、status=REJECTED、守恒不变、有 +A 退回流水。
 */
class AdminWithdrawTest extends TestCase
{
    private string $token;
    private MerchantWalletService $wallet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->token  = $this->makeAdminToken();
        $this->wallet = new MerchantWalletService();
    }

    private function hdr(): array
    {
        return $this->bearer($this->token);
    }

    /** 申请一笔待审提现单,返回 [商户, 提现单]。 */
    private function pendingWithdrawal(string $balance, string $amount): array
    {
        $m = $this->makeMerchant(['balance' => $balance]);
        $w = $this->wallet->applyWithdrawal((int) $m->id, $amount, 'alipay:foo@bar');
        return [$m, $w];
    }

    public function testApprovePaysOutAndFreezesDecrease(): void
    {
        [$m, $w] = $this->pendingWithdrawal('100.00', '30.00');
        // 申请后:balance=70 frozen=30
        $this->assertSame('70.00', Merchant::find($m->id)->balance);
        $this->assertSame('30.00', Merchant::find($m->id)->frozen_balance);

        $r = $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/approve', [], $this->hdr());
        $this->assertSame(0, $r['code']);

        $reload = Merchant::find($m->id);
        // balance 不变,frozen 减少 30
        $this->assertSame('70.00', $reload->balance);
        $this->assertSame('0.00', $reload->frozen_balance);
        // 总额减少 A:70+0 = 70 = 100-30
        $this->assertSame(0, Money::cmp(Money::add($reload->balance, $reload->frozen_balance), '70.00'));

        $paid = Withdrawal::find($w->id);
        $this->assertSame(Withdrawal::STATUS_PAID, $paid->status);
        // 打款后必须留下处理时间(供商户/平台查处理时刻)
        $this->assertNotEmpty($paid->processed_at, 'approve 后应写入 processed_at');

        // 不应产生新的收入/退回流水:仍只有申请那条 -30
        $logs = MerchantFundLog::where('merchant_id', $m->id)
            ->where('type', MerchantFundLog::TYPE_WITHDRAW)->select();
        $this->assertCount(1, $logs);
        $this->assertSame('-30.00', $logs[0]->amount);
    }

    public function testRejectRefundsToBalanceConservedWithLog(): void
    {
        [$m, $w] = $this->pendingWithdrawal('100.00', '30.00');

        $r = $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/reject', [], $this->hdr());
        $this->assertSame(0, $r['code']);

        $reload = Merchant::find($m->id);
        // frozen→balance:balance 回到 100,frozen 归 0
        $this->assertSame('100.00', $reload->balance);
        $this->assertSame('0.00', $reload->frozen_balance);
        // 守恒不变:balance+frozen = 100
        $this->assertSame(0, Money::cmp(Money::add($reload->balance, $reload->frozen_balance), '100.00'));

        $rejected = Withdrawal::find($w->id);
        $this->assertSame(Withdrawal::STATUS_REJECTED, $rejected->status);
        // 拒绝同样属"已处理",应写入处理时间
        $this->assertNotEmpty($rejected->processed_at, 'reject 后应写入 processed_at');

        // 退回流水 +30,balance_after=100
        $refund = MerchantFundLog::where('merchant_id', $m->id)
            ->where('type', MerchantFundLog::TYPE_WITHDRAW)
            ->order('id', 'desc')->find();
        $this->assertSame(0, Money::cmp($refund->amount, '30.00'));
        $this->assertSame('100.00', $refund->balance_after);
    }

    public function testApproveNonPendingRejected(): void
    {
        [, $w] = $this->pendingWithdrawal('100.00', '30.00');
        // 先 approve 成功
        $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/approve', [], $this->hdr());
        // 再 approve 应报状态非法(幂等防双花)
        $r = $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/approve', [], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testRejectNonPendingRejected(): void
    {
        [, $w] = $this->pendingWithdrawal('100.00', '30.00');
        $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/reject', [], $this->hdr());
        // 已拒绝单再 reject 应报状态非法,且不二次退款
        $r = $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/reject', [], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testApproveThenRejectBlocked(): void
    {
        [$m, $w] = $this->pendingWithdrawal('100.00', '30.00');
        $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/approve', [], $this->hdr());
        // 已打款单不可再拒绝(否则会错误地退回余额造成双花)
        $r = $this->callJson('POST', '/admin/withdrawals/' . $w->id . '/reject', [], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
        // 余额未被错误退回
        $this->assertSame('70.00', Merchant::find($m->id)->balance);
        $this->assertSame('0.00', Merchant::find($m->id)->frozen_balance);
    }

    public function testListFilterByStatus(): void
    {
        [, $w1] = $this->pendingWithdrawal('100.00', '10.00');
        [, $w2] = $this->pendingWithdrawal('100.00', '20.00');
        $this->callJson('POST', '/admin/withdrawals/' . $w1->id . '/approve', [], $this->hdr());

        $r = $this->callJson('GET', '/admin/withdrawals', ['status' => Withdrawal::STATUS_PENDING], $this->hdr());
        $this->assertSame(0, $r['code']);
        $ids = array_column($r['data']['items'], 'id');
        $this->assertContains((int) $w2->id, $ids);
        $this->assertNotContains((int) $w1->id, $ids);
    }

    public function testRequiresAdminAuth(): void
    {
        [, $w] = $this->pendingWithdrawal('100.00', '30.00');
        $this->assertSame(401, $this->call('POST', '/admin/withdrawals/' . $w->id . '/approve')->getCode());
        $this->assertSame(401, $this->call('GET', '/admin/withdrawals')->getCode());
    }
}
