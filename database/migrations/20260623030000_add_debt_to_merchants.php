<?php

use think\migration\Migrator;

/**
 * 商户「负欠」科目(B1 资金安全):
 * 已提现的货款事后被退款时,差额不再把 balance 写成负数,而是落入 debt(待清偿)。
 * 规则:① 退款冲回不足部分计入 debt;② 后续入账先抵 debt 再入 balance;
 *      ③ 有 debt(>0)时禁止提现,清偿后方可恢复。杜绝"负欠被新入账稀释后再次提现"的重复套现。
 */
class AddDebtToMerchants extends Migrator
{
    public function change()
    {
        $this->table('merchants')
            ->addColumn('debt', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0, 'null' => false, 'after' => 'frozen_balance', 'comment' => '负欠(已提现却被退款的待清偿差额)'])
            ->update();
    }
}
