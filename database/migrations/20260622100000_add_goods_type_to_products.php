<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class AddGoodsTypeToProducts extends Migrator
{
    public function change()
    {
        $this->table('products')
            ->addColumn('goods_type', 'integer', [
                'limit'   => MysqlAdapter::INT_TINY,
                'default' => 1,
                'null'    => false,
                'comment' => '商品类型:1卡密/2知识/3资源/4权益(与 type 发货方式正交)',
                'after'   => 'type',
            ])
            ->addIndex(['merchant_id', 'goods_type'], ['name' => 'idx_merchant_goods_type'])
            ->update();
    }
}
