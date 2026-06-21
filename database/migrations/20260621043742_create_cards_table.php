<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateCardsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('cards', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '卡密(库存核心)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('product_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('secret', 'string', ['limit' => 1024, 'null' => false, 'comment' => '卡密内容'])
            ->addColumn('secret_hash', 'char', ['limit' => 64, 'null' => false, 'collation' => 'ascii_bin', 'encoding' => 'ascii', 'comment' => 'SHA-256(secret) 去重指纹'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0未售/1锁定/2已售/3作废'])
            ->addColumn('order_id', 'biginteger', ['signed' => false, 'null' => true, 'comment' => '锁定/售出归属订单'])
            ->addColumn('batch_no', 'string', ['limit' => 32, 'null' => true])
            ->addColumn('locked_at', 'datetime', ['null' => true])
            ->addColumn('sold_at', 'datetime', ['null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            // 取卡核心索引:按 product+status 扫描可售卡,id 保证有序
            ->addIndex(['product_id', 'status', 'id'], ['name' => 'idx_pick'])
            ->addIndex(['product_id', 'secret_hash'], ['unique' => true, 'name' => 'uniq_secret'])
            ->addIndex(['order_id'], ['name' => 'idx_order'])
            ->addIndex(['status', 'locked_at'], ['name' => 'idx_lock_expire'])
            // 承载交易数据,禁止随商户/商品级联删除(spec §10.1)
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_cards_merchant'])
            ->addForeignKey('product_id', 'products', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_cards_product'])
            ->create();
        // 注:order_id → orders 的外键在 orders 建表后补加(见 CreateOrdersTable)
    }
}
