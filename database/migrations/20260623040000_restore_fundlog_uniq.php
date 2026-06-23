<?php

use think\migration\Migrator;

/**
 * 恢复 merchant_fund_logs 的 uniq(order_id,type)(spec §10.4.5「结算幂等的数据库级兜底」)。
 * 此前因「退款佣金回冲」复用 TYPE_COMMISSION(=2)与结算佣金冲突而被移除;现退款回冲改用
 * 独立 TYPE_REFUND_COMMISSION(=5),(order_id,type) 不再冲突,可恢复唯一索引。
 * 先把历史的「退款佣金回冲」行(type=2 且备注以"退款佣金回冲"开头)迁到 type=5,再建唯一索引。
 */
class RestoreFundlogUniq extends Migrator
{
    public function up()
    {
        // 1) 历史退款佣金回冲行 type 2 → 5(消除与结算佣金的 (order_id,type) 重复)
        $this->execute("UPDATE merchant_fund_logs SET type = 5 WHERE type = 2 AND remark LIKE '退款佣金回冲%'");

        // 2) 恢复唯一索引(若仍存在残留重复会报错,提示需人工清理脏数据)
        $t = $this->table('merchant_fund_logs');
        if (!$t->hasIndexByName('uniq_order_type')) {
            $t->addIndex(['order_id', 'type'], ['unique' => true, 'name' => 'uniq_order_type'])->update();
        }
    }

    public function down()
    {
        $t = $this->table('merchant_fund_logs');
        if ($t->hasIndexByName('uniq_order_type')) {
            $t->removeIndexByName('uniq_order_type')->update();
        }
    }
}
