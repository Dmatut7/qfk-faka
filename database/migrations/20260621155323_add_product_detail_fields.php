<?php

use think\migration\Migrator;
use think\migration\db\Column;

class AddProductDetailFields extends Migrator
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
        // 商品:购买须知 + 库存显示方式(对标鲸发卡 item purchase_notice / show_stock_type)
        $this->table('products')
            ->addColumn('purchase_notice', 'text', ['null' => true, 'default' => null, 'comment' => '购买须知(下单前提示)', 'after' => 'delivery_message'])
            ->addColumn('show_stock_type', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 0, 'comment' => '库存显示方式:0模糊 1精确', 'after' => 'purchase_notice'])
            ->update();
    }
}
