<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateOrdersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('orders', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '订单',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('order_no', 'string', ['limit' => 32, 'null' => false, 'comment' => '业务订单号'])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('product_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('buyer_id', 'biginteger', ['signed' => false, 'null' => true])
            ->addColumn('buyer_email', 'string', ['limit' => 128, 'null' => false, 'comment' => '收货邮箱'])
            ->addColumn('buyer_contact', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('quantity', 'integer', ['null' => false])
            ->addColumn('unit_price', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false])
            ->addColumn('total_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0待支付/1已支付/2已发货/3已关闭/4已退款/5异常待人工'])
            ->addColumn('pay_channel', 'string', ['limit' => 32, 'null' => true])
            ->addColumn('delivered_content', 'text', ['limit' => MysqlAdapter::TEXT_MEDIUM, 'null' => true, 'comment' => '发货卡密快照'])
            ->addColumn('client_ip', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('paid_at', 'datetime', ['null' => true])
            ->addColumn('delivered_at', 'datetime', ['null' => true])
            ->addColumn('expire_at', 'datetime', ['null' => false, 'comment' => '未支付过期时间(仅 status=0 有效)'])
            ->addColumn('remark', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['order_no'], ['unique' => true, 'name' => 'uniq_order_no'])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->addIndex(['buyer_email'], ['name' => 'idx_buyer_email'])
            ->addIndex(['status', 'expire_at'], ['name' => 'idx_expire'])
            ->addIndex(['product_id'], ['name' => 'idx_product'])
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_orders_merchant'])
            ->addForeignKey('product_id', 'products', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_orders_product'])
            ->addForeignKey('buyer_id', 'buyers', 'id', ['delete' => 'SET_NULL', 'update' => 'NO_ACTION', 'constraint' => 'fk_orders_buyer'])
            ->create();
    }
}
