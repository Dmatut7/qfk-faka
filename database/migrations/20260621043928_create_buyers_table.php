<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateBuyersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('buyers', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '买家(可选账号)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('email', 'string', ['limit' => 128, 'null' => false, 'comment' => '登录/收货标识'])
            ->addColumn('password', 'string', ['limit' => 255, 'null' => true, 'comment' => '游客下单为空'])
            ->addColumn('contact', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['email'], ['unique' => true, 'name' => 'uniq_email'])
            ->create();
    }
}
