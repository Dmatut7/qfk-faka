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

        // 固定窗口:key 不存在时置 1 并设窗口 TTL;已存在则只自增,保留剩余 TTL(窗口自然结束)
        if ($count === 0) {
            Cache::set($key, 1, $window);
        } else {
            Cache::inc($key);
        }

        return $next($request);
    }
}
