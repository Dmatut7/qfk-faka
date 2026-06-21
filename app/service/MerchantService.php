<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Merchant;

/**
 * 商户鉴权与账号服务。
 */
class MerchantService
{
    public function login(string $username, string $password, string $ip = ''): array
    {
        $m = Merchant::where('username', $username)->find();
        if (!$m || !password_verify($password, (string) $m->password)) {
            throw new BizException(Code::UNAUTHORIZED, '用户名或密码错误');
        }
        if ((int) $m->status !== Merchant::STATUS_ACTIVE) {
            $msg = (int) $m->status === Merchant::STATUS_PENDING ? '商户待审核' : '商户已冻结';
            throw new BizException(Code::FORBIDDEN, $msg);
        }

        $token = (new TokenService())->issue(AccessToken::OWNER_MERCHANT, (int) $m->id);

        $m->last_login_at = date('Y-m-d H:i:s');
        if ($ip !== '') {
            $m->last_login_ip = $ip;
        }
        $m->save();

        return ['token' => $token, 'merchant' => $m->toArray()];
    }

    public function logout(string $token): void
    {
        (new TokenService())->revoke($token);
    }

    /**
     * 商户自助改密;成功后吊销其全部令牌(强制重新登录)。
     */
    public function changePassword(int $merchantId, string $oldPassword, string $newPassword): void
    {
        $m = Merchant::find($merchantId);
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        if (!password_verify($oldPassword, (string) $m->password)) {
            throw new BizException(Code::UNAUTHORIZED, '原密码错误');
        }

        $m->password = password_hash($newPassword, PASSWORD_BCRYPT);
        $m->save();

        (new TokenService())->revokeAllFor(AccessToken::OWNER_MERCHANT, $merchantId);
    }
}
