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
    /** 恒定时间登录用的占位 bcrypt 哈希(任意有效哈希即可,仅为让 password_verify 照常做满 bcrypt 耗时) */
    private const DUMMY_HASH = '$2y$10$PS/.AoCeYjNm/Rh3bLTXSeUHnB69mCDXDQmwR.n0bvnlpyBvAd0fe';

    public function login(string $username, string $password, string $ip = ''): array
    {
        $admin = Admin::where('username', $username)->find();
        // 用户名不存在时也对 dummy 哈希跑一次 password_verify,消除"用户是否存在"的响应耗时差,防用户名枚举(timing oracle)
        $ok = password_verify($password, $admin ? (string) $admin->password : self::DUMMY_HASH);
        if (!$admin || !$ok) {
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
