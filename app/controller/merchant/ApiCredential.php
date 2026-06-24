<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantApiService;

/**
 * 商户开放 API 凭据(MerchantAuth)。生成/重置 api_key + api_secret(secret 仅返回一次)。
 */
class ApiCredential extends BaseApiController
{
    public function generate(MerchantApiService $svc)
    {
        return $this->success($svc->generateCredentials($this->authId()));
    }
}
