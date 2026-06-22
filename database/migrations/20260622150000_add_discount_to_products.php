<?php

use think\migration\Migrator;

class AddDiscountToProducts extends Migrator
{
    public function change()
    {
        $this->table('products')
            ->addColumn('discount_price', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => true, 'default' => null, 'comment' => '限时折扣价(窗口内生效,需<price);空=无限时折扣', 'after' => 'market_price'])
            ->addColumn('discount_start', 'datetime', ['null' => true, 'comment' => '限时折扣开始(空=无下限)', 'after' => 'discount_price'])
            ->addColumn('discount_end', 'datetime', ['null' => true, 'comment' => '限时折扣结束(空=无上限)', 'after' => 'discount_start'])
            ->update();
    }
}
