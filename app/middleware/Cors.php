<?php
declare(strict_types=1);

namespace app\middleware;

use Closure;
use think\Request;
use think\Response;

/**
 * 跨域(CORS)中间件:补充跨域响应头,放行 OPTIONS 预检。
 */
class Cors
{
    public function handle(Request $request, Closure $next): Response
    {
        if (strtoupper($request->method()) === 'OPTIONS') {
            $response = Response::create('', 'html', 204);
        } else {
            $response = $next($request);
        }

        $origin = $request->header('origin', '*');

        // 安全:本 API 全程 Bearer 令牌鉴权(令牌存 localStorage,无 Cookie/Session),
        // 前端从不使用 credentials:'include'。故**不下发** Access-Control-Allow-Credentials —
        // 「回显任意 Origin」+「Allow-Credentials:true」是会让任意站点携凭证跨域读响应的危险组合,
        // 去掉 Allow-Credentials 即中和该向量(Bearer 头由各源 JS 自行携带,不受影响)。
        return $response
            ->header([
                'Access-Control-Allow-Origin'      => $origin ?: '*',
                'Access-Control-Allow-Methods'     => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers'     => 'Authorization, Content-Type, X-Requested-With',
                'Access-Control-Max-Age'           => '86400',
            ]);
    }
}
