<?php
// +----------------------------------------------------------------------
// | 控制台配置
// +----------------------------------------------------------------------
return [
    // 指令定义
    'commands' => [
        'order:clean'     => \app\command\OrderClean::class,
        'stock:reconcile' => \app\command\StockReconcile::class,
        'db:seed'         => \app\command\SeedDemo::class,
    ],
];
