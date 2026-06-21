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

// ============ 买家前台 buyer(公开) ============
Route::get('s/:slug', 'buyer.Shop/store');
Route::get('buyer/product/:id', 'buyer.Shop/product');
Route::post('buyer/order', 'buyer.Order/create');
Route::post('buyer/order/query', 'buyer.Order/query');
Route::post('buyer/order/:no/pay', 'buyer.Order/pay');

// ============ 平台后台 admin ============
Route::group('admin', function () {
    Route::post('login', 'admin.Auth/login');

    Route::group(function () {
        Route::post('logout', 'admin.Auth/logout');
        Route::get('me', 'admin.Profile/me');
        // 商户管理
        Route::post('merchants', 'admin.Merchants/create');
    })->middleware(\app\middleware\AdminAuth::class);
});

// ============ 商户后台 merchant ============
Route::group('merchant', function () {
    Route::post('login', 'merchant.Auth/login');

    Route::group(function () {
        Route::post('logout', 'merchant.Auth/logout');
        Route::get('me', 'merchant.Profile/me');
        Route::post('change-password', 'merchant.Profile/changePassword');

        // 分类管理(全用 POST + 路径 id,便于测试与跨端兼容)
        Route::get('categories', 'merchant.Category/index');
        Route::post('categories', 'merchant.Category/create');
        Route::post('categories/:id', 'merchant.Category/update');
        Route::post('categories/:id/delete', 'merchant.Category/delete');

        // 商品管理
        Route::get('products', 'merchant.Product/index');
        Route::post('products', 'merchant.Product/create');
        Route::post('products/:id', 'merchant.Product/update');
        Route::post('products/:id/status', 'merchant.Product/setStatus');
        Route::post('products/:id/delete', 'merchant.Product/delete');

        // 卡密管理
        Route::post('cards/import', 'merchant.Card/import');
        Route::get('products/:productId/cards', 'merchant.Card/index');
        Route::get('products/:productId/cards/stats', 'merchant.Card/stats');
        Route::post('cards/:id/disable', 'merchant.Card/disable');
        Route::post('cards/:id/delete', 'merchant.Card/delete');
    })->middleware(\app\middleware\MerchantAuth::class);
});
