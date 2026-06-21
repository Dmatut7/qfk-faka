<?php
declare(strict_types=1);

namespace app\service;

use app\util\Money;

/**
 * 结算计算:订单成交后,平台抽佣与商户入账的金额拆分(全程 bcmath)。
 */
class SettlementService
{
    /**
     * @return array ['commission'=>string, 'income'=>string] —— 佣金 + 入账 恒等于 total
     */
    public function calc(string $total, string $rate): array
    {
        $commission = Money::mul($total, $rate);
        $income     = Money::sub($total, $commission);

        return ['commission' => $commission, 'income' => $income];
    }
}
