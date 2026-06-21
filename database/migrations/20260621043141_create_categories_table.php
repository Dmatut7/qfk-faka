<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateCategoriesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('categories', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商品分类(商户级)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false, 'comment' => '升序'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1显示/0隐藏'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'sort'], ['name' => 'idx_merchant_sort'])
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION', 'constraint' => 'fk_categories_merchant'])
            ->create();
    }
}
