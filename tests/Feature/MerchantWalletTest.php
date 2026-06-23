<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Withdrawal;
use app\service\MerchantWalletService;
use app\util\Money;
use tests\TestCase;

/**
 * 商户资金/提现 (T7.2, TDD):balance→frozen,总额守恒,余额不足拒绝。
 */
class MerchantWalletTest extends TestCase
{
    private MerchantWalletService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new MerchantWalletService();
    }

    private function merchant(string $balance): Merchant
    {
        return $this->makeMerchant(['balance' => $balance]);
    }

    public function testApplyMovesBalanceToFrozenConserved(): void
    {
        $m = $this->merchant('100.00');
        $w = $this->svc->applyWithdrawal((int) $m->id, '30.00', 'alipay:foo@bar');

        $reload = Merchant::find($m->id);
        $this->assertSame('70.00', $reload->balance);
        $this->assertSame('30.00', $reload->frozen_balance);
        // 守恒:balance + frozen 不变
        $this->assertSame(0, Money::cmp(Money::add($reload->balance, $reload->frozen_balance), '100.00'));

        // 提现单待审
        $this->assertSame(Withdrawal::STATUS_PENDING, Withdrawal::find($w->id)->status);
        $this->assertSame('30.00', Withdrawal::find($w->id)->amount);

        // 流水:-30
        $log = MerchantFundLog::where('merchant_id', $m->id)->where('type', MerchantFundLog::TYPE_WITHDRAW)->find();
        $this->assertSame('-30.00', $log->amount);
        $this->assertSame('70.00', $log->balance_after);
    }

    /** 提现手续费:配置 withdraw_fee_rate 后 fee=amount×rate 落库(此前恒为 0.00 是半成品) */
    public function testWithdrawFeeComputedFromConfiguredRate(): void
    {
        (new \app\service\SettingService())->set('withdraw_fee_rate', '0.02'); // 2%
        $m = $this->merchant('100.00');
        $w = $this->svc->applyWithdrawal((int) $m->id, '100.00', 'alipay:foo@bar');

        $this->assertSame('100.00', Money::add((string) $w->amount, '0'));
        $this->assertSame('2.00', Money::add((string) $w->fee, '0'), '手续费应为 100×2%=2.00');
        // 全额冻结(实收 = 100-2 = 98,fee 为平台手续费收入)
        $reload = Merchant::find($m->id);
        $this->assertSame('0.00', Money::add((string) $reload->balance, '0'));
        $this->assertSame('100.00', Money::add((string) $reload->frozen_balance, '0'));
    }

    /** 未配置费率(默认)时手续费为 0,行为不变(向后兼容) */
    public function testWithdrawFeeZeroWhenRateUnset(): void
    {
        $m = $this->merchant('50.00');
        $w = $this->svc->applyWithdrawal((int) $m->id, '50.00', 'alipay:x');
        $this->assertSame('0.00', Money::add((string) $w->fee, '0'));
    }

    /** L22:纯空白收款账户必须被拒,且不动余额、不建提现单 */
    public function testBlankAccountInfoRejected(): void
    {
        $m = $this->merchant('100.00');
        try {
            $this->svc->applyWithdrawal((int) $m->id, '30.00', "   \t ");
            $this->fail('纯空白收款账户应被拒');
        } catch (BizException $e) {
            $this->assertSame(Code::PARAM_ERROR, $e->getBizCode());
        }
        $this->assertSame('100.00', Merchant::find($m->id)->balance, '被拒不得动余额');
        $this->assertSame(0, Withdrawal::where('merchant_id', $m->id)->count(), '被拒不得建提现单');
    }

    public function testInsufficientBalanceRejected(): void
    {
        $m = $this->merchant('10.00');
        try {
            $this->svc->applyWithdrawal((int) $m->id, '20.00', 'acc');
            $this->fail('应余额不足');
        } catch (BizException $e) {
            $this->assertSame(Code::STATE_INVALID, $e->getBizCode());
        }
        // 余额不变
        $this->assertSame('10.00', Merchant::find($m->id)->balance);
        $this->assertSame(0, Withdrawal::where('merchant_id', $m->id)->count());
    }

    public function testZeroOrNegativeRejected(): void
    {
        $m = $this->merchant('100.00');
        foreach (['0.00', '-5.00'] as $amt) {
            try {
                $this->svc->applyWithdrawal((int) $m->id, $amt, 'acc');
                $this->fail('应拒绝非正金额');
            } catch (BizException $e) {
                $this->assertSame(Code::PARAM_ERROR, $e->getBizCode());
            }
        }
    }

    public function testBelowMinimumWithdrawRejected(): void
    {
        $m = $this->merchant('100.00');
        // 低于最小提现额(1.00)→ 拒绝;恰好 1.00 允许
        try {
            $this->svc->applyWithdrawal((int) $m->id, '0.50', 'acc');
            $this->fail('低于最小提现额应被拒');
        } catch (BizException $e) {
            $this->assertSame(Code::PARAM_ERROR, $e->getBizCode());
        }
        $w = $this->svc->applyWithdrawal((int) $m->id, '1.00', 'acc');
        $this->assertNotNull($w->id);
    }

    public function testFrozenMerchantWithdrawForbidden(): void
    {
        $m = $this->makeMerchant(['balance' => '100.00', 'status' => Merchant::STATUS_FROZEN]);
        try {
            $this->svc->applyWithdrawal((int) $m->id, '30.00', 'acc');
            $this->fail('冻结商户应被拒绝提现');
        } catch (BizException $e) {
            $this->assertSame(Code::FORBIDDEN, $e->getBizCode());
        }
        // 余额与冻结不动,不产生提现单
        $reload = Merchant::find($m->id);
        $this->assertSame('100.00', $reload->balance);
        $this->assertSame('0.00', $reload->frozen_balance);
        $this->assertSame(0, Withdrawal::where('merchant_id', $m->id)->count());
    }

    public function testExactBalanceAllowed(): void
    {
        $m = $this->merchant('50.00');
        $this->svc->applyWithdrawal((int) $m->id, '50.00', 'acc');
        $reload = Merchant::find($m->id);
        $this->assertSame('0.00', $reload->balance);
        $this->assertSame('50.00', $reload->frozen_balance);
    }
}
