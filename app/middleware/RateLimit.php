<?php
declare(strict_types=1);

namespace app\middleware;

use app\common\Code;
use Closure;
use think\facade\Cache;
use think\Request;
use think\Response;

/**
 * 基础限流中间件:同一 IP + 路径在窗口内超过阈值返回 429。
 *
 * 用法:->middleware([\app\middleware\RateLimit::class, 60, 60])  // 60 次 / 60 秒
 */
class RateLimit
{
    public function handle(Request $request, Closure $next, int $limit = 60, int $window = 60): Response
    {
        $key   = 'rl:' . md5($request->ip() . '|' . $request->pathinfo());
        $count = (int) Cache::get($key, 0);

        if ($count >= $limit) {
            return apiError(Code::RATE_LIMITED, '请求过于频繁,请稍后再试');
        }

        // 首次置入时设置窗口 TTL;窗口内累加
        Cache::set($key, $count + 1, $window);

        return $next($request);
    }
}
