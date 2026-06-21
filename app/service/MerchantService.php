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

    /** 店铺装修可由商户编辑的字段(deposit/verified 平台控,不在此列) */
    private const SHOP_EDITABLE = ['logo', 'cover', 'intro', 'announcement', 'contact_qq', 'contact_wechat', 'contact_mobile'];

    /**
     * 读取当前商户的店铺装修信息。
     */
    public function getShop(int $merchantId): array
    {
        $m = Merchant::find($merchantId);
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        return [
            'store_name'     => $m->store_name,
            'store_slug'     => $m->store_slug,
            'logo'           => $m->logo,
            'cover'          => $m->cover,
            'intro'          => $m->intro,
            'announcement'   => $m->announcement,
            'contact_qq'     => $m->contact_qq,
            'contact_wechat' => $m->contact_wechat,
            'contact_mobile' => $m->contact_mobile,
            'deposit'        => $m->deposit,
            'verified'       => (int) $m->verified,
            'sales_count'    => (int) $m->sales_count,
        ];
    }

    /**
     * 更新店铺装修。仅接受白名单字段;deposit/verified 由平台控制,商户不可改。
     */
    public function updateShop(int $merchantId, array $d): array
    {
        $m = Merchant::find($merchantId);
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        $patch = array_intersect_key($d, array_flip(self::SHOP_EDITABLE));
        if ($patch) {
            $m->save($patch);
        }
        return $this->getShop($merchantId);
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
