<?php
declare(strict_types=1);

namespace app\middleware;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Admin;
use app\service\TokenService;
use Closure;
use think\Request;
use think\Response;

/**
 * 平台后台鉴权中间件。
 *
 * 校验 Bearer 令牌 → 必须是 admin 类型且账号启用 →
 * 将当前管理员注入 $request->admin / $request->authId / $request->bearerToken。
 */
class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->bearer($request);
        $info  = (new TokenService())->verify($token);

        if (!$info || $info['owner_type'] !== AccessToken::OWNER_ADMIN) {
            throw new BizException(Code::UNAUTHORIZED, '未登录或登录已失效');
        }

        $admin = Admin::find($info['owner_id']);
        if (!$admin || (int) $admin->status !== Admin::STATUS_ENABLED) {
            throw new BizException(Code::TOKEN_INVALID, '账号不可用');
        }

        $request->admin       = $admin;
        $request->authId      = (int) $admin->id;
        $request->bearerToken = $token;

        return $next($request);
    }

    private function bearer(Request $request): string
    {
        $header = (string) $request->header('authorization', '');
        if (stripos($header, 'bearer ') === 0) {
            return substr($header, 7);
        }
        return (string) $request->param('token', '');
    }
}
