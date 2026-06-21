<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateMerchantsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('merchants', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商户',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('username', 'string', ['limit' => 64, 'null' => false, 'comment' => '登录名'])
            ->addColumn('password', 'string', ['limit' => 255, 'null' => false, 'comment' => 'bcrypt'])
            ->addColumn('email', 'string', ['limit' => 128, 'null' => true])
            ->addColumn('phone', 'string', ['limit' => 32, 'null' => true])
            ->addColumn('store_name', 'string', ['limit' => 128, 'null' => false, 'comment' => '店铺名'])
            ->addColumn('store_slug', 'string', ['limit' => 64, 'null' => false, 'comment' => '店铺访问标识'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0待审/1正常/2冻结'])
            ->addColumn('balance', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0, 'null' => false, 'comment' => '可提现余额'])
            ->addColumn('frozen_balance', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0, 'null' => false, 'comment' => '冻结中'])
            ->addColumn('commission_rate', 'decimal', ['precision' => 5, 'scale' => 4, 'default' => 0, 'null' => false, 'comment' => '平台抽佣 0~1'])
            ->addColumn('api_key', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('api_secret', 'string', ['limit' => 128, 'null' => true])
            ->addColumn('last_login_at', 'datetime', ['null' => true])
            ->addColumn('last_login_ip', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['username'], ['unique' => true, 'name' => 'uniq_username'])
            ->addIndex(['email'], ['unique' => true, 'name' => 'uniq_email'])
            ->addIndex(['store_slug'], ['unique' => true, 'name' => 'uniq_slug'])
            ->addIndex(['api_key'], ['unique' => true, 'name' => 'uniq_api_key'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->create();
    }
}
