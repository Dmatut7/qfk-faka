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

    /**
     * 商户自助注册(公开)。落库为待审核,store_slug 自动生成,需平台审核通过后方可登录上架。
     */
    public function register(MerchantService $svc)
    {
        $data = $this->params(['username', 'password', 'store_name', 'email', 'invite_code']);
        $this->validate($data, [
            'username'   => 'require|length:3,64',
            'password'   => 'require|min:6',
            'store_name' => 'require|max:128',
            'email'      => 'email',
        ], [
            'username.require'   => '用户名必填',
            'password.require'   => '密码必填',
            'password.min'       => '密码至少 6 位',
            'store_name.require' => '店铺名必填',
            'email.email'        => '邮箱格式不正确',
        ]);

        return $this->success($svc->register($data));
    }

    public function logout(MerchantService $svc)
    {
        $svc->logout((string) ($this->request->bearerToken ?? ''));
        return $this->success();
    }
}
