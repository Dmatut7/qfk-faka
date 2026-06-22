<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class AddGoodsTypeToOrders extends Migrator
{
    public function change()
    {
        $this->table('orders')
            ->addColumn('goods_type', 'integer', [
                'limit'   => MysqlAdapter::INT_TINY,
                'default' => 1,
                'null'    => false,
                'comment' => '下单时商品类型快照:1卡密/2知识/3资源/4权益(决定发货路由)',
                'after'   => 'product_title',
            ])
            ->update();
    }
}
