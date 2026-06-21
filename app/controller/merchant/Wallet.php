<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantWalletService;

/**
 * 商户后台:钱包(余额/流水/提现,受 MerchantAuth 保护)。
 */
class Wallet extends BaseApiController
{
    public function balance(MerchantWalletService $svc)
    {
        return $this->success($svc->balance($this->authId()));
    }

    public function fundLogs(MerchantWalletService $svc)
    {
        return $this->success($svc->fundLogs($this->authId(), (int) $this->input('page', 1)));
    }

    public function withdrawals(MerchantWalletService $svc)
    {
        return $this->success($svc->withdrawals($this->authId(), (int) $this->input('page', 1)));
    }

    public function applyWithdrawal(MerchantWalletService $svc)
    {
        $d = $this->params(['amount', 'account_info']);
        $this->validate($d, [
            'amount'       => 'require|float|gt:0',
            'account_info' => 'require|max:255',
        ], ['amount.gt' => '提现金额必须大于 0']);

        $w = $svc->applyWithdrawal($this->authId(), (string) $d['amount'], (string) $d['account_info']);
        return $this->success(['id' => (int) $w->id, 'amount' => $w->amount, 'status' => (int) $w->status]);
    }
}
