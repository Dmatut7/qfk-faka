<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateForbiddenItemsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('forbidden_items', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '平台禁售目录(违禁商品类目)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('category', 'string', ['limit' => 64, 'default' => '其他', 'null' => false, 'comment' => '禁售类目'])
            ->addColumn('title', 'string', ['limit' => 200, 'null' => false, 'comment' => '禁售项名称'])
            ->addColumn('description', 'string', ['limit' => 500, 'default' => '', 'null' => false, 'comment' => '说明/依据'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false, 'comment' => '排序,越大越前'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1展示/0隐藏'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['status', 'sort'], ['name' => 'idx_status_sort'])
            ->create();
    }
}
