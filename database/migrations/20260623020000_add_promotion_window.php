<?php

use think\migration\Migrator;

/**
 * 满减满折活动加「生效/失效时间」窗口(限时活动)。
 * 两列均可空:NULL = 该端无限制(start_at 空=立即生效;end_at 空=长期有效)。
 * 取最优促销时只在 [start_at, end_at] 窗口内的活动才参与。
 */
class AddPromotionWindow extends Migrator
{
    public function change()
    {
        $this->table('promotions')
            ->addColumn('start_at', 'datetime', ['null' => true, 'after' => 'status', 'comment' => '生效时间;空=立即生效'])
            ->addColumn('end_at', 'datetime', ['null' => true, 'after' => 'start_at', 'comment' => '失效时间;空=长期有效'])
            ->update();
    }
}
