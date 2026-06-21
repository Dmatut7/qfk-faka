<?php
declare(strict_types=1);

namespace app\middleware;

use think\Request;

/**
 * 从请求中提取 Bearer 令牌(Authorization 头优先,回退 ?token= 参数)。
 */
trait ExtractsBearerToken
{
    protected function bearer(Request $request): string
    {
        $header = (string) $request->header('authorization', '');
        if (stripos($header, 'bearer ') === 0) {
            return substr($header, 7);
        }
        return (string) $request->param('token', '');
    }
}
