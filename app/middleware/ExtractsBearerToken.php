<?php
declare(strict_types=1);

namespace app\middleware;

use think\Request;

/**
 * 从请求中提取 Bearer 令牌:**仅** Authorization 头。
 *
 * 安全(security hunt #1):不再回退 ?token= 查询参数——令牌落进 URL 会泄漏到
 * 浏览器历史、服务端 access log、Referer 头、CDN/代理日志(且本系统令牌 24h
 * 有效、无 IP/会话绑定,泄漏即可被重放)。买家端与控制台均以 Authorization 头
 * 携带令牌,移除回退无兼容影响。
 */
trait ExtractsBearerToken
{
    protected function bearer(Request $request): string
    {
        $header = (string) $request->header('authorization', '');
        if (stripos($header, 'bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return '';
    }
}
