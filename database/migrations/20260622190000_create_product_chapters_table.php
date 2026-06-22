<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateProductChaptersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('product_chapters', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '知识类商品章节(课程/小说/电子书多章节内容)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('product_id', 'biginteger', ['signed' => false, 'null' => false, 'comment' => '所属商品'])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false, 'comment' => '所属商户(归属校验)'])
            ->addColumn('title', 'string', ['limit' => 200, 'null' => false, 'comment' => '章节标题'])
            ->addColumn('content', 'text', ['limit' => MysqlAdapter::TEXT_MEDIUM, 'default' => null, 'null' => true, 'comment' => '章节正文(富文本)'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false, 'comment' => '排序,越小越前'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1上架/0下架'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['product_id', 'sort'], ['name' => 'idx_product_sort'])
            ->create();
    }
}
