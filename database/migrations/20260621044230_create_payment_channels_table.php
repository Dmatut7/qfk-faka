<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreatePaymentChannelsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('payment_channels', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '支付渠道配置',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('code', 'string', ['limit' => 32, 'null' => false, 'comment' => 'alipay/wxpay/epay'])
            ->addColumn('name', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('driver', 'string', ['limit' => 64, 'null' => false, 'comment' => '驱动类'])
            ->addColumn('config', 'json', ['null' => false, 'comment' => 'app_id/网关/密钥/sign_type 等'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1启用/0停用'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['code'], ['unique' => true, 'name' => 'uniq_code'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->create();
    }
}
