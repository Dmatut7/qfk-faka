<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateArticlesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('articles', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '门户内容(资讯/常见问题/单页)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1资讯/2常见问题/3单页'])
            ->addColumn('title', 'string', ['limit' => 200, 'null' => false, 'comment' => '标题'])
            ->addColumn('summary', 'string', ['limit' => 500, 'default' => '', 'null' => false, 'comment' => '列表摘要'])
            ->addColumn('category', 'string', ['limit' => 50, 'default' => '', 'null' => false, 'comment' => '分组标签(如FAQ分类)'])
            ->addColumn('content', 'text', ['limit' => MysqlAdapter::TEXT_MEDIUM, 'null' => false, 'comment' => '富文本正文'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1发布/0草稿'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false, 'comment' => '排序值,越大越靠前'])
            ->addColumn('views', 'integer', ['default' => 0, 'null' => false, 'signed' => false, 'comment' => '浏览量'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['type', 'status', 'sort'], ['name' => 'idx_type_status_sort'])
            ->create();
    }
}
