<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateInviteCodesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('invite_codes', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '注册邀请码',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('code', 'string', ['limit' => 32, 'null' => false, 'comment' => '邀请码(唯一)'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1启用/0停用'])
            ->addColumn('note', 'string', ['limit' => 200, 'null' => true, 'comment' => '备注'])
            ->addColumn('max_uses', 'integer', ['default' => 1, 'null' => false, 'comment' => '最大可用次数,0=不限'])
            ->addColumn('used_count', 'integer', ['default' => 0, 'null' => false, 'comment' => '已使用次数'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addIndex(['code'], ['unique' => true, 'name' => 'uniq_code'])
            ->create();
    }
}
