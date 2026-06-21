<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006~2018 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: liu21st <liu21st@gmail.com>
// +----------------------------------------------------------------------
use think\facade\Route;

// 健康检查 / 探活接口
Route::get('health', 'Health/index');

// ============ 平台后台 admin ============
Route::group('admin', function () {
    Route::post('login', 'admin.Auth/login');

    Route::group(function () {
        Route::post('logout', 'admin.Auth/logout');
        Route::get('me', 'admin.Profile/me');
    })->middleware(\app\middleware\AdminAuth::class);
});
