<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateBuyerBlacklistTable extends Migrator
{
    public function change()
    {
        $table = $this->table('buyer_blacklist', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '买家黑名单(平台级,按邮箱拦截下单)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('email', 'string', ['limit' => 128, 'null' => false, 'comment' => '被拉黑的买家邮箱(小写)'])
            ->addColumn('reason', 'string', ['limit' => 255, 'default' => '', 'null' => false, 'comment' => '拉黑原因'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1生效/0解除'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['email'], ['unique' => true, 'name' => 'uniq_email'])
            ->create();
    }
}
