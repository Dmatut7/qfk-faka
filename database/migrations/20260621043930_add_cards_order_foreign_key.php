<?php

use think\migration\Migrator;

/**
 * 在 orders 建表后,补加 cards.order_id → orders.id 外键(ON DELETE SET NULL)。
 * 拆为独立迁移以解决 cards 先于 orders 创建的循环依赖。
 */
class AddCardsOrderForeignKey extends Migrator
{
    public function up()
    {
        $this->table('cards')
            ->addForeignKey('order_id', 'orders', 'id', [
                'delete'     => 'SET_NULL',
                'update'     => 'NO_ACTION',
                'constraint' => 'fk_cards_order',
            ])
            ->update();
    }

    public function down()
    {
        $this->table('cards')->dropForeignKey('order_id')->update();
    }
}
