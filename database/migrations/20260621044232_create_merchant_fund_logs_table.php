<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateMerchantFundLogsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('merchant_fund_logs', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商户资金流水(余额账本,只增不改)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'null' => false, 'comment' => '1订单收入/2平台佣金/3提现/4退款'])
            ->addColumn('amount', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false, 'comment' => '正收入/负支出'])
            ->addColumn('balance_after', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false, 'comment' => '变动后余额'])
            ->addColumn('order_id', 'biginteger', ['signed' => false, 'null' => true])
            ->addColumn('remark', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'id'], ['name' => 'idx_merchant'])
            ->addIndex(['order_id'], ['name' => 'idx_order'])
            // 结算幂等的数据库级兜底:同一订单同类型流水至多一条(NULL order_id 不约束)
            ->addIndex(['order_id', 'type'], ['unique' => true, 'name' => 'uniq_order_type'])
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_fundlog_merchant'])
            ->addForeignKey('order_id', 'orders', 'id', ['delete' => 'SET_NULL', 'update' => 'NO_ACTION', 'constraint' => 'fk_fundlog_order'])
            ->create();
    }
}
