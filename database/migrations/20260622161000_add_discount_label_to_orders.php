<?php

use think\migration\Migrator;

class AddDiscountLabelToOrders extends Migrator
{
    public function change()
    {
        $this->table('orders')
            ->addColumn('discount_label', 'string', [
                'limit'   => 64,
                'default' => '',
                'null'    => false,
                'comment' => '优惠来源标签(券:CODE / 满减 / 满折),用于展示',
                'after'   => 'discount_amount',
            ])
            ->update();
    }
}
