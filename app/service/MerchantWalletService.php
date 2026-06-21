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

    public function balance(int $merchantId): array
    {
        $m = Merchant::find($merchantId);
        return [
            'balance'        => $m->balance,
            'frozen_balance' => $m->frozen_balance,
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

        $attempt = 0;
        while (true) {
            try {
                return Db::transaction(function () use ($merchantId, $amount, $accountInfo) {
                    $now = date('Y-m-d H:i:s');
                    $m   = Merchant::where('id', $merchantId)->lock(true)->find();
                    if (!$m) {
                        throw new BizException(Code::NOT_FOUND, '商户不存在');
                    }
                    if (Money::cmp($amount, (string) $m->balance) > 0) {
                        throw new BizException(Code::STATE_INVALID, '可提现余额不足');
                    }

                    $newBalance = Money::sub((string) $m->balance, $amount);
                    $newFrozen  = Money::add((string) $m->frozen_balance, $amount);
                    Db::name('merchants')->where('id', $merchantId)
                        ->update(['balance' => $newBalance, 'frozen_balance' => $newFrozen, 'update_time' => $now]);

                    $w = Withdrawal::create([
                        'merchant_id' => $merchantId, 'amount' => $amount, 'fee' => '0.00',
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
