<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminService;

/**
 * 平台管理员登录/登出。
 */
class Auth extends BaseApiController
{
    public function login(AdminService $svc)
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

    public function logout(AdminService $svc)
    {
        $svc->logout((string) ($this->request->bearerToken ?? ''));
        return $this->success();
    }
}
