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
Route::post('buyer/order', 'buyer.Order/create')->middleware(\app\middleware\RateLimit::class, 30, 60); // 30 次/分
Route::post('buyer/order/query', 'buyer.Order/query');
Route::post('buyer/order/:no/pay', 'buyer.Order/pay');

// ============ 支付异步回调(公开,靠验签)============
Route::rule('pay/notify/:channel', 'pay.Notify/index')->middleware(\app\middleware\RateLimit::class, 120, 60);

// ============ 平台后台 admin ============
Route::group('admin', function () {
    Route::post('login', 'admin.Auth/login');

    Route::group(function () {
        Route::post('logout', 'admin.Auth/logout');
        Route::get('me', 'admin.Profile/me');
        // 平台仪表盘聚合
        Route::get('dashboard', 'admin.Dashboard/index');
        // 商户管理
        Route::get('merchants', 'admin.Merchants/index');
        Route::post('merchants', 'admin.Merchants/create');
        Route::post('merchants/:id/approve', 'admin.Merchants/approve');
        Route::post('merchants/:id/freeze', 'admin.Merchants/freeze');
        Route::post('merchants/:id/unfreeze', 'admin.Merchants/unfreeze');
        Route::post('merchants/:id/commission', 'admin.Merchants/setCommission');
        Route::post('merchants/:id/reset-password', 'admin.Merchants/resetPassword');

        // 支付渠道管理 (T8.2)
        Route::get('channels', 'admin.Channels/index');
        Route::post('channels', 'admin.Channels/create');
        Route::post('channels/:id', 'admin.Channels/update');
        Route::post('channels/:id/status', 'admin.Channels/setStatus');
        Route::post('channels/:id/test-sign', 'admin.Channels/testSign');

        // 提现审核 (T8.3)
        Route::get('withdrawals', 'admin.Withdrawals/index');
        Route::post('withdrawals/:id/approve', 'admin.Withdrawals/approve');
        Route::post('withdrawals/:id/reject', 'admin.Withdrawals/reject');

        // 平台配置 + 对账报表 (T8.4)
        Route::get('settings', 'admin.System/settings');
        Route::post('settings', 'admin.System/setSetting');
        Route::get('reports/settlement', 'admin.System/settlementReport');

        // 跨商户只读视图 (T8.5)
        Route::get('orders', 'admin.Orders/index');
        Route::get('products', 'admin.Products/index');
    })->middleware(\app\middleware\AdminAuth::class);
});

// ============ 商户后台 merchant ============
Route::group('merchant', function () {
    Route::post('login', 'merchant.Auth/login');
    Route::post('register', 'merchant.Auth/register'); // 商户自助注册(公开,落库待审核)

    Route::group(function () {
        Route::post('logout', 'merchant.Auth/logout');
        Route::get('me', 'merchant.Profile/me');
        Route::post('change-password', 'merchant.Profile/changePassword');

        // 店铺装修(deposit/verified 平台控,商户不可改)
        Route::get('shop', 'merchant.Shop/show');
        Route::post('shop', 'merchant.Shop/update');

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

        // 订单管理
        Route::get('orders', 'merchant.Order/index');
        Route::get('orders/:id', 'merchant.Order/detail');
        Route::post('orders/:id/close', 'merchant.Order/close');
        Route::post('orders/:id/redeliver', 'merchant.Order/redeliver');

        // 钱包 / 提现
        Route::get('wallet', 'merchant.Wallet/balance');
        Route::get('wallet/fund-logs', 'merchant.Wallet/fundLogs');
        Route::get('wallet/withdrawals', 'merchant.Wallet/withdrawals');
        Route::post('wallet/withdrawals', 'merchant.Wallet/applyWithdrawal');

        // 统计
        Route::get('stats/summary', 'merchant.Stats/summary');
        Route::get('stats/top-products', 'merchant.Stats/topProducts');
    })->middleware(\app\middleware\MerchantAuth::class);
});
