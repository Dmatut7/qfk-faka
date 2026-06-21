<?php
// 全局中间件定义文件
return [
    // 跨域 + 请求日志(全局)
    \app\middleware\Cors::class,
    \app\middleware\RequestLog::class,
];
