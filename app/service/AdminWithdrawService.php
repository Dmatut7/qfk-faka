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
 * 平台侧提现审核:待审(PENDING)→ 已打款(PAID)/ 拒绝(REJECTED)。
 *
 * 资金守恒约定(申请时已做 balance-=A、frozen+=A 并记一条 type=WITHDRAW、amount=-A 的流水):
 * - approve:钱已付出平台,frozen-=A,status=PAID。不动 balance、不再记收入流水。
 *   总额 balance+frozen 减少 A(钱离开平台,正确)。
 * - reject:把冻结退回可用,frozen-=A、balance+=A,status=REJECTED,记一条
 *   type=WITHDRAW、amount=+A 的退回流水。balance+frozen 守恒不变。
 *
 * 幂等/防双花:approve/reject 在事务 + 商户行锁内重查 withdrawal.status==PENDING,
 * 否则报 STATE_INVALID;重复审核不二次处理。死锁/锁等待超时有限重试。
 */
class AdminWithdrawService
{
    private const MAX_RETRY = 3;

    /** 提现单列表(可按 status 筛选) */
    public function list(array $filter, int $page = 1, int $size = 20): array
    {
        $q = Withdrawal::order('id', 'desc');
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        if (!empty($filter['merchant_id'])) {
            $q->where('merchant_id', (int) $filter['merchant_id']);
        }
        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();
        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /** 审核打款:待审 → 已打款。frozen-=A,不动 balance,不记收入流水。 */
    public function approve(int $withdrawalId): Withdrawal
    {
        return $this->run(function () use ($withdrawalId) {
            $now = date('Y-m-d H:i:s');
            $w   = $this->lockPending($withdrawalId);
            $m   = $this->lockMerchant((int) $w->merchant_id);

            $amount    = (string) $w->amount;
            $newFrozen = Money::sub((string) $m->frozen_balance, $amount);

            Db::name('merchants')->where('id', $m->id)
                ->update(['frozen_balance' => $newFrozen, 'update_time' => $now]);

            Db::name('withdrawals')->where('id', $w->id)
                ->update(['status' => Withdrawal::STATUS_PAID, 'update_time' => $now]);

            return Withdrawal::find($w->id);
        });
    }

    /** 拒绝:待审 → 拒绝。frozen-=A、balance+=A(退回可用),记 +A 退回流水。守恒不变。 */
    public function reject(int $withdrawalId): Withdrawal
    {
        return $this->run(function () use ($withdrawalId) {
            $now = date('Y-m-d H:i:s');
            $w   = $this->lockPending($withdrawalId);
            $m   = $this->lockMerchant((int) $w->merchant_id);

            $amount     = (string) $w->amount;
            $newFrozen  = Money::sub((string) $m->frozen_balance, $amount);
            $newBalance = Money::add((string) $m->balance, $amount);

            Db::name('merchants')->where('id', $m->id)
                ->update(['balance' => $newBalance, 'frozen_balance' => $newFrozen, 'update_time' => $now]);

            Db::name('withdrawals')->where('id', $w->id)
                ->update(['status' => Withdrawal::STATUS_REJECTED, 'update_time' => $now]);

            MerchantFundLog::create([
                'merchant_id'   => (int) $m->id,
                'type'          => MerchantFundLog::TYPE_WITHDRAW,
                'amount'        => '+' . $amount,
                'balance_after' => $newBalance,
                'remark'        => '提现拒绝退回 #' . $w->id,
            ]);

            return Withdrawal::find($w->id);
        });
    }

    /** 在事务内锁定待审提现单;非待审报 STATE_INVALID(幂等/防双花)。 */
    private function lockPending(int $withdrawalId): Withdrawal
    {
        $w = Withdrawal::where('id', $withdrawalId)->lock(true)->find();
        if (!$w) {
            throw new BizException(Code::NOT_FOUND, '提现单不存在');
        }
        if ((int) $w->status !== Withdrawal::STATUS_PENDING) {
            throw new BizException(Code::STATE_INVALID, '仅待审提现单可审核');
        }
        return $w;
    }

    private function lockMerchant(int $merchantId): Merchant
    {
        $m = Merchant::where('id', $merchantId)->lock(true)->find();
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        return $m;
    }

    /** 事务包裹 + 死锁有限重试。 */
    private function run(callable $work): Withdrawal
    {
        $attempt = 0;
        while (true) {
            try {
                return Db::transaction($work);
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
