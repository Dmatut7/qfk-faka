<?php
declare(strict_types=1);

namespace app\middleware;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Buyer;
use app\service\TokenService;
use Closure;
use think\Request;
use think\Response;

/**
 * 买家鉴权中间件:校验 Bearer 令牌 → 必须 buyer 类型且状态正常 →
 * 注入 $request->buyer / $request->authId。仅用于「我的订单」等已登录买家接口;
 * 下单/查单等公开接口不挂此中间件(游客可用)。
 */
class BuyerAuth
{
    use ExtractsBearerToken;

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->bearer($request);
        $info  = (new TokenService())->verify($token);

        if (!$info || $info['owner_type'] !== AccessToken::OWNER_BUYER) {
            throw new BizException(Code::UNAUTHORIZED, '未登录或登录已失效');
        }

        $buyer = Buyer::find($info['owner_id']);
        if (!$buyer || (int) $buyer->status !== Buyer::STATUS_NORMAL) {
            throw new BizException(Code::TOKEN_INVALID, '买家账号不可用');
        }

        $request->buyer  = $buyer;
        $request->authId = (int) $buyer->id;

        return $next($request);
    }
}
