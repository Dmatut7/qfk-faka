<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantService;

/**
 * 商户登录/登出。
 */
class Auth extends BaseApiController
{
    public function login(MerchantService $svc)
    {
        $data = $this->params(['username', 'password']);
        $this->validate($data, [
            'username' => 'require',
            'password' => 'require',
        ], [
            'username.require' => '用户名必填',
            'password.require' => '密码必填',
        ]);

        return $this->success($svc->login($data['username'], $data['password'], $this->request->ip()));
    }

    public function logout(MerchantService $svc)
    {
        $svc->logout((string) ($this->request->bearerToken ?? ''));
        return $this->success();
    }
}
