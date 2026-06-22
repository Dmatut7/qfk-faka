<?php

use think\migration\Migrator;

/**
 * 移除 merchant_fund_logs 的 uniq(order_id,type) 唯一索引。
 * 结算幂等的真实保证是「订单行锁 + 状态重查」(见 NotifyService.settle / 既有并发测试),
 * 该唯一索引仅为冗余兜底,且会阻止退款产生的反向流水(同一订单需 settle 的 COMMISSION 与
 * refund 的 COMMISSION 回冲两条)。改为普通索引保留按订单查询性能。
 */
class DropFundlogUniqOrderType extends Migrator
{
    public function up()
    {
        $t = $this->table('merchant_fund_logs');
        if ($t->hasIndexByName('uniq_order_type')) {
            $t->removeIndexByName('uniq_order_type')->update();
        }
    }

    public function down()
    {
        $this->table('merchant_fund_logs')
            ->addIndex(['order_id', 'type'], ['unique' => true, 'name' => 'uniq_order_type'])
            ->update();
    }
}
