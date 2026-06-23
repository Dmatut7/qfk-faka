<?php

use think\migration\Migrator;

/**
 * 性能:为后台仪表盘/对账报表/统计的「时间区间 + 状态/类型」聚合补热点索引。
 * 此前 orders 无任何含 create_time 的索引、merchant_fund_logs 无 type/create_time 索引,
 * 平台仪表盘(每次打开跑 ~10 条按时间窗的 COUNT/SUM)与对账报表在数据量上涨后退化为全表扫描。
 * 纯加索引,不改任何业务逻辑。
 */
class AddAggregateIndexes extends Migrator
{
    public function up()
    {
        $orders = $this->table('orders');
        if (!$orders->hasIndexByName('idx_status_ctime')) {
            // status + 时间窗:覆盖 dashboard 状态计数、DELIVERED+时间窗销售额、对账 whereIn(status)+create_time
            $orders->addIndex(['status', 'create_time'], ['name' => 'idx_status_ctime'])->update();
        }
        if (!$orders->hasIndexByName('idx_ctime')) {
            // 纯时间窗:dashboard 不带 status 的订单数 today/yesterday
            $orders->addIndex(['create_time'], ['name' => 'idx_ctime'])->update();
        }

        $logs = $this->table('merchant_fund_logs');
        if (!$logs->hasIndexByName('idx_type_ctime')) {
            // type + 时间窗:跨商户佣金/利润聚合(AdminViewService/AdminReportService)
            $logs->addIndex(['type', 'create_time'], ['name' => 'idx_type_ctime'])->update();
        }
    }

    public function down()
    {
        $orders = $this->table('orders');
        foreach (['idx_status_ctime', 'idx_ctime'] as $idx) {
            if ($orders->hasIndexByName($idx)) {
                $orders->removeIndexByName($idx)->update();
            }
        }
        $logs = $this->table('merchant_fund_logs');
        if ($logs->hasIndexByName('idx_type_ctime')) {
            $logs->removeIndexByName('idx_type_ctime')->update();
        }
    }
}
