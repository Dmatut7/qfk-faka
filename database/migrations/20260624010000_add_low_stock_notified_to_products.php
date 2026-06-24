<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class AddLowStockNotifiedToProducts extends Migrator
{
    public function change()
    {
        $this->table('products')
            ->addColumn('low_stock_notified', 'integer', [
                'limit'   => MysqlAdapter::INT_TINY,
                'default' => 0,
                'null'    => false,
                'comment' => '已发过低库存预警(1=已发,补货回升后清零再武装)',
                'after'   => 'stock',
            ])
            ->update();
    }
}
