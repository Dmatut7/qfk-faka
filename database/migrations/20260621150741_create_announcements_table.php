<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateAnnouncementsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('announcements', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '平台公告',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('title', 'string', ['limit' => 200, 'null' => false, 'comment' => '标题'])
            ->addColumn('content', 'text', ['null' => false, 'comment' => '正文'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1显示/0隐藏'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false, 'comment' => '排序值,越大越靠前'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['status', 'sort'], ['name' => 'idx_status_sort'])
            ->create();
    }
}
