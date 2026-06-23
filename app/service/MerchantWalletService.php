<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Withdrawal;
use app\util\Money;
use think\facade\Db;

/**
 * 商户钱包:余额、资金流水、申请提现(balance→frozen,行锁防丢失更新/双花)。
 */
class MerchantWalletService
{
    private const MAX_RETRY = 3;

    /** 最小提现额(防 0.01 级微额提现刷爆打款工单) */
    private const MIN_WITHDRAW = '1.00';

    public function balance(int $merchantId): array
    {
        $m = Merchant::find($merchantId);
        return [
            'balance'        => $m->balance,
            'frozen_balance' => $m->frozen_balance,
            'debt'           => $m->debt ?? '0.00', // 负欠(>0 时不可提现,后续入账先抵欠)
            'commission_rate' => $m->commission_rate,
        ];
    }

    public function fundLogs(int $merchantId, int $page = 1, int $size = 20): array
    {
        $q     = MerchantFundLog::where('merchant_id', $merchantId);
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();
        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    public function withdrawals(int $merchantId, int $page = 1, int $size = 20): array
    {
        $q     = Withdrawal::where('merchant_id', $merchantId);
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();
        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /**
     * 申请提现:可提余额 balance → 冻结 frozen_balance(总额守恒),建待审提现单 + 流水。
     */
    public function applyWithdrawal(int $merchantId, string $amount, string $accountInfo): Withdrawal
    {
        if (!preg_match('/^\d+(\.\d{1,2})?$/', $amount) || Money::cmp($amount, '0') <= 0) {
            throw new BizException(Code::PARAM_ERROR, '提现金额必须为正');
        }
        // L2:最小提现额护栏(防微额提现刷爆打款工单)
        if (Money::cmp($amount, self::MIN_WITHDRAW) < 0) {
            throw new BizException(Code::PARAM_ERROR, '单笔提现不得低于 ' . self::MIN_WITHDRAW . ' 元');
        }
        // L22:收款账户信息去空白并拒空(控制器 require 放行纯空格,会落库成无效打款账户)
        $accountInfo = trim($accountInfo);
        if ($accountInfo === '') {
            throw new BizException(Code::PARAM_ERROR, '请填写收款账户信息');
        }

        // 提现手续费:平台配置 withdraw_fee_rate(0~1 小数),fee = amount × rate(2 位)。
        // 此前 fee 恒为 '0.00' 是半成品(配置项与商户/平台 UI 的「手续费」列都在、后端从不计算),此处补全。
        // 商户提现 amount(冻结/扣减全额),实收 amount - fee,fee 为平台手续费收入。
        $rate = (string) ((new SettingService())->get('withdraw_fee_rate', '0') ?? '0');
        if (!preg_match('/^\d+(\.\d+)?$/', $rate) || Money::cmp($rate, '0') < 0 || Money::cmp($rate, '1') >= 0) {
            $rate = '0'; // 配置非法(非 [0,1) 小数)→ 视为不收费,避免坏配置卡死提现
        }
        $fee = Money::round(Money::mul($amount, $rate));

        $attempt = 0;
        while (true) {
            try {
                return Db::transaction(function () use ($merchantId, $amount, $accountInfo, $fee) {
                    $now = date('Y-m-d H:i:s');
                    $m   = Merchant::where('id', $merchantId)->lock(true)->find();
                    if (!$m) {
                        throw new BizException(Code::NOT_FOUND, '商户不存在');
                    }
                    if ((int) $m->status !== Merchant::STATUS_ACTIVE) {
                        throw new BizException(Code::FORBIDDEN, '账号状态异常,暂不可提现');
                    }
                    // B1 负欠隔离:有未清偿负欠时禁止提现(后续入账先抵欠,清零后方可提),
                    // 杜绝"已提现订单退款致负欠被新入账稀释后再次提现"的重复套现。
                    if (Money::cmp((string) ($m->debt ?? '0'), '0') > 0) {
                        throw new BizException(Code::STATE_INVALID, '存在未清偿负欠,清偿后方可提现');
                    }
                    if (Money::cmp($amount, (string) $m->balance) > 0) {
                        throw new BizException(Code::STATE_INVALID, '可提现余额不足');
                    }

                    $newBalance = Money::sub((string) $m->balance, $amount);
                    $newFrozen  = Money::add((string) $m->frozen_balance, $amount);
                    Db::name('merchants')->where('id', $merchantId)
                        ->update(['balance' => $newBalance, 'frozen_balance' => $newFrozen, 'update_time' => $now]);

                    $w = Withdrawal::create([
                        'merchant_id' => $merchantId, 'amount' => $amount, 'fee' => $fee,
                        'account_info' => $accountInfo, 'status' => Withdrawal::STATUS_PENDING,
                    ]);

                    MerchantFundLog::create([
                        'merchant_id' => $merchantId, 'type' => MerchantFundLog::TYPE_WITHDRAW,
                        'amount' => '-' . $amount, 'balance_after' => $newBalance,
                        'remark' => '提现申请 #' . $w->id,
                    ]);

                    return $w;
                });
            } catch (\think\db\exception\PDOException $e) {
                $msg = $e->getMessage();
                if ((false !== stripos($msg, 'Deadlock found') || false !== stripos($msg, 'Lock wait timeout')) && ++$attempt < self::MAX_RETRY) {
                    usleep(10000 * $attempt);
                    continue;
                }
                throw $e;
            }
        }
    }
}
