<?php

use think\migration\Migrator;

class CreateAdminsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('admins', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '平台管理员',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('username', 'string', ['limit' => 64, 'null' => false, 'comment' => '登录名'])
            ->addColumn('password', 'string', ['limit' => 255, 'null' => false, 'comment' => 'bcrypt'])
            ->addColumn('nickname', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('status', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1启用/0禁用'])
            ->addColumn('last_login_at', 'datetime', ['null' => true])
            ->addColumn('last_login_ip', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['username'], ['unique' => true, 'name' => 'uniq_username'])
            ->create();
    }
}
