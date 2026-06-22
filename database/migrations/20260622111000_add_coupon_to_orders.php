<?php

use think\migration\Migrator;

class AddCouponToOrders extends Migrator
{
    public function change()
    {
        $this->table('orders')
            ->addColumn('coupon_id', 'biginteger', ['signed' => false, 'null' => true, 'comment' => '使用的优惠券id,空=未用券', 'after' => 'total_amount'])
            ->addColumn('coupon_code', 'string', ['limit' => 32, 'default' => '', 'null' => false, 'comment' => '券码快照', 'after' => 'coupon_id'])
            ->addColumn('original_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '优惠前金额(price×qty)', 'after' => 'coupon_code'])
            ->addColumn('discount_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'null' => false, 'comment' => '优惠额;total_amount=original-discount=应付', 'after' => 'original_amount'])
            ->update();

        // 历史订单回填:原价=应付(无券),保证 original_amount 口径正确
        $this->execute('UPDATE orders SET original_amount = total_amount WHERE original_amount = 0');
    }
}
