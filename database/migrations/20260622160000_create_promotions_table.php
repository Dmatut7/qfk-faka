<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreatePromotionsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('promotions', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商户订单级促销(满减/满折,自动生效)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 64, 'default' => '', 'null' => false, 'comment' => '活动名'])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1满减/2满折'])
            ->addColumn('threshold', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '订单满此额触发'])
            ->addColumn('value', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '满减=减额;满折=折扣百分比(90=九折)'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1启用/0停用'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->create();
    }
}
