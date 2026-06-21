<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Admin;

/**
 * 平台管理员鉴权服务。
 */
class AdminService
{
    public function login(string $username, string $password, string $ip = ''): array
    {
        $admin = Admin::where('username', $username)->find();
        if (!$admin || !password_verify($password, (string) $admin->password)) {
            throw new BizException(Code::UNAUTHORIZED, '用户名或密码错误');
        }
        if ((int) $admin->status !== Admin::STATUS_ENABLED) {
            throw new BizException(Code::FORBIDDEN, '账号已禁用');
        }

        $token = (new TokenService())->issue(AccessToken::OWNER_ADMIN, (int) $admin->id);

        $admin->last_login_at = date('Y-m-d H:i:s');
        if ($ip !== '') {
            $admin->last_login_ip = $ip;
        }
        $admin->save();

        return ['token' => $token, 'admin' => $admin->toArray()];
    }

    public function logout(string $token): void
    {
        (new TokenService())->revoke($token);
    }
}
