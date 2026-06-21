<?php
declare(strict_types=1);

namespace app\middleware;

use Closure;
use think\facade\Log;
use think\Request;
use think\Response;

/**
 * 请求日志中间件:记录方法/路径/耗时/状态码(写入日志文件,不输出到响应)。
 */
class RequestLog
{
    public function handle(Request $request, Closure $next): Response
    {
        $start    = microtime(true);
        $response = $next($request);
        $ms       = round((microtime(true) - $start) * 1000, 1);

        Log::info(sprintf('[req] %s /%s %sms code=%d', $request->method(), $request->pathinfo(), $ms, $response->getCode()));

        return $response;
    }
}
