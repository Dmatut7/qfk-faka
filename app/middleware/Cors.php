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

        return $response
            ->header([
                'Access-Control-Allow-Origin'      => $origin ?: '*',
                'Access-Control-Allow-Methods'     => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers'     => 'Authorization, Content-Type, X-Requested-With',
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Max-Age'           => '86400',
            ]);
    }
}
