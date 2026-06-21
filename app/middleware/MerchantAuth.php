<?php
declare(strict_types=1);

namespace app\middleware;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Merchant;
use app\service\TokenService;
use Closure;
use think\Request;
use think\Response;

/**
 * 商户后台鉴权中间件。
 *
 * 校验 Bearer 令牌 → 必须是 merchant 类型且状态为正常(ACTIVE)→
 * 将当前商户注入 $request->merchant / $request->authId / $request->bearerToken。
 */
class MerchantAuth
{
    use ExtractsBearerToken;

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->bearer($request);
        $info  = (new TokenService())->verify($token);

        if (!$info || $info['owner_type'] !== AccessToken::OWNER_MERCHANT) {
            throw new BizException(Code::UNAUTHORIZED, '未登录或登录已失效');
        }

        $merchant = Merchant::find($info['owner_id']);
        if (!$merchant || (int) $merchant->status !== Merchant::STATUS_ACTIVE) {
            throw new BizException(Code::TOKEN_INVALID, '商户账号不可用');
        }

        $request->merchant    = $merchant;
        $request->authId      = (int) $merchant->id;
        $request->bearerToken = $token;

        return $next($request);
    }
}
