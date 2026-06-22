<?php

use think\migration\Migrator;

class AddRefundFieldsToOrders extends Migrator
{
    public function change()
    {
        $this->table('orders')
            ->addColumn('refund_reason', 'string', ['limit' => 255, 'null' => true, 'comment' => '退款原因', 'after' => 'delivered_at'])
            ->addColumn('refunded_at', 'datetime', ['null' => true, 'comment' => '退款时间', 'after' => 'refund_reason'])
            ->update();
    }
}
