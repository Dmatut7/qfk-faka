<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateCouponsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('coupons', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商户优惠券',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'integer', ['signed' => false, 'null' => false, 'comment' => '所属商户'])
            ->addColumn('code', 'string', ['limit' => 32, 'null' => false, 'comment' => '券码(商户内唯一)'])
            ->addColumn('name', 'string', ['limit' => 64, 'default' => '', 'null' => false, 'comment' => '券名'])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1满减/2折扣'])
            ->addColumn('value', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '满减=减额;折扣=折扣百分比(90=九折)'])
            ->addColumn('min_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '最低订单额(满减门槛)'])
            ->addColumn('max_discount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '折扣封顶,0=不封顶'])
            ->addColumn('total', 'integer', ['default' => 0, 'null' => false, 'comment' => '发放总量,0=不限'])
            ->addColumn('used', 'integer', ['default' => 0, 'null' => false, 'comment' => '已核销数'])
            ->addColumn('valid_from', 'datetime', ['null' => true, 'comment' => '生效时间,空=即时'])
            ->addColumn('valid_to', 'datetime', ['null' => true, 'comment' => '失效时间,空=长期'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1启用/0停用'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'code'], ['unique' => true, 'name' => 'uniq_merchant_code'])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->create();
    }
}
