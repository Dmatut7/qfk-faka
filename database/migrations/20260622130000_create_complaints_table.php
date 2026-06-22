<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateComplaintsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('complaints', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '订单投诉/售后工单',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('order_id', 'biginteger', ['signed' => false, 'null' => false, 'comment' => '关联订单'])
            ->addColumn('order_no', 'string', ['limit' => 32, 'null' => false, 'comment' => '订单号快照'])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('buyer_email', 'string', ['limit' => 128, 'null' => false, 'comment' => '发起人邮箱'])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 4, 'null' => false, 'comment' => '1未收到/2卡密无效/3描述不符/4其他'])
            ->addColumn('description', 'string', ['limit' => 1000, 'default' => '', 'null' => false, 'comment' => '问题描述'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0待商户处理/1商户已回复/2平台介入中/3已解决/4已驳回'])
            ->addColumn('merchant_reply', 'string', ['limit' => 1000, 'default' => '', 'null' => false, 'comment' => '商户回复'])
            ->addColumn('admin_remark', 'string', ['limit' => 1000, 'default' => '', 'null' => false, 'comment' => '平台裁决备注'])
            ->addColumn('refunded', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '裁决是否已触发退款'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->addIndex(['order_id'], ['name' => 'idx_order'])
            ->create();
    }
}
