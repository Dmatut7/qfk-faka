<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateProductsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('products', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商品',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('category_id', 'biginteger', ['signed' => false, 'null' => true])
            ->addColumn('title', 'string', ['limit' => 128, 'null' => false])
            ->addColumn('sku', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('description', 'text', ['null' => true])
            ->addColumn('price', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false, 'comment' => '售价'])
            ->addColumn('type', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1自动发卡/2手动发货'])
            ->addColumn('stock', 'integer', ['default' => 0, 'null' => false, 'comment' => '可售卡密数缓存'])
            ->addColumn('sales_count', 'integer', ['default' => 0, 'null' => false])
            ->addColumn('min_buy', 'integer', ['default' => 1, 'null' => false])
            ->addColumn('max_buy', 'integer', ['default' => 0, 'null' => false, 'comment' => '0=不限'])
            ->addColumn('delivery_message', 'text', ['null' => true, 'comment' => '发货附言'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 1, 'null' => false, 'comment' => '1在售/0下架'])
            ->addColumn('sort', 'integer', ['default' => 0, 'null' => false])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->addIndex(['merchant_id', 'sku'], ['unique' => true, 'name' => 'uniq_merchant_sku'])
            ->addIndex(['category_id'], ['name' => 'idx_category'])
            // products→merchants 用 RESTRICT:有商品的商户禁止硬删(spec §10.1)
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_products_merchant'])
            ->addForeignKey('category_id', 'categories', 'id', ['delete' => 'SET_NULL', 'update' => 'NO_ACTION', 'constraint' => 'fk_products_category'])
            ->create();
    }
}
