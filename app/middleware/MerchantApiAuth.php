<?php
declare(strict_types=1);

namespace app\middleware;

use app\service\MerchantApiService;
use Closure;
use think\Request;
use think\Response;

/**
 * 商户开放 API 鉴权:校验 app_key + timestamp + HMAC 签名,注入 $request->merchant / authId。
 * 失败由 MerchantApiService 抛 BizException,经全局异常处理返回标准错误。
 */
class MerchantApiAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $merchant = (new MerchantApiService())->authenticate($request->param());
        $request->merchant = $merchant;
        $request->authId   = (int) $merchant->id;

        return $next($request);
    }
}
