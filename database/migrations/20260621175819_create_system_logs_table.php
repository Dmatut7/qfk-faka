<?php

use think\migration\Migrator;

class CreateSystemLogsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('system_logs', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '系统日志',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('type', 'string', ['limit' => 50, 'null' => false, 'comment' => 'pay_verify_fail/settle_exception/stock_not_enough/withdraw_approve/withdraw_reject/login_fail 等'])
            ->addColumn('level', 'string', ['limit' => 16, 'default' => 'info', 'null' => false, 'comment' => 'info/warning/error'])
            ->addColumn('order_no', 'string', ['limit' => 64, 'null' => true, 'comment' => '关联订单号(可空)'])
            ->addColumn('message', 'string', ['limit' => 500, 'default' => '', 'null' => false, 'comment' => '摘要'])
            ->addColumn('context', 'json', ['null' => true, 'comment' => '结构化上下文'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addIndex(['type'], ['name' => 'idx_type'])
            ->addIndex(['create_time'], ['name' => 'idx_create_time'])
            ->create();
    }
}
