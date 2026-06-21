<?php

use think\migration\Migrator;
use think\migration\db\Column;

class AddOrderProductTitle extends Migrator
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        // 订单商品名快照:下单时记录,商品改名/删除后订单仍显示当时商品名
        $this->table('orders')
            ->addColumn('product_title', 'string', ['limit' => 200, 'null' => true, 'default' => null, 'comment' => '下单时商品名快照', 'after' => 'product_id'])
            ->update();
    }
}
