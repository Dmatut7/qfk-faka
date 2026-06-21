<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreatePaymentsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('payments', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '支付单/支付流水',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('payment_no', 'string', ['limit' => 32, 'null' => false, 'comment' => '平台支付单号=out_trade_no'])
            ->addColumn('order_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false, 'comment' => '冗余对账;回调校验 == order.merchant_id'])
            ->addColumn('channel', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('amount', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0待支付/1成功/2失败'])
            ->addColumn('channel_trade_no', 'string', ['limit' => 64, 'null' => true, 'comment' => '第三方交易号'])
            ->addColumn('paid_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => true, 'comment' => '回调实付'])
            ->addColumn('notify_payload', 'text', ['null' => true, 'comment' => '原始回调报文留证'])
            ->addColumn('notified_at', 'datetime', ['null' => true])
            ->addColumn('paid_at', 'datetime', ['null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['payment_no'], ['unique' => true, 'name' => 'uniq_payment_no'])
            ->addIndex(['order_id'], ['name' => 'idx_order'])
            // 回调幂等二级兜底:仅 channel_trade_no 非空时去重(NULL 不约束)
            ->addIndex(['channel', 'channel_trade_no'], ['unique' => true, 'name' => 'uniq_channel_trade'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('order_id', 'orders', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_payments_order'])
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_payments_merchant'])
            ->create();
    }
}
