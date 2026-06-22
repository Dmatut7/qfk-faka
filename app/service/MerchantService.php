<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Merchant;
use think\facade\Db;

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
     * 商户自助注册:落库为待审核(pending),需平台审核通过后方可登录/上架。
     *
     * - username 唯一;email(若提供)格式由控制器校验、唯一性此处校验。
     * - store_slug 自动生成且唯一(基于随机串,冲突时重试)。
     * - balance/frozen_balance/deposit/verified=0;commission_rate 取平台默认。
     * - 密码 bcrypt。
     *
     * 邀请码闸门(读平台设置 registration_require_invite,'1' 要求 / 默认 '0' 不要求):
     * - 要求时:invite_code 必填,且核销成功(存在/启用/未用尽)后才创建商户;
     * - 不要求时:传了 invite_code 也照样核销(无效则报错),不传则放行。
     * 核销(used_count+1)与建户在同一事务内,保证「用了码才建户,建户失败则用量回滚」。
     *
     * @return array{merchant_id:int, status:int}
     */
    public function register(array $d): array
    {
        $username = (string) ($d['username'] ?? '');
        if (Merchant::where('username', $username)->find()) {
            throw new BizException(Code::STATE_INVALID, '用户名已存在');
        }
        $email = isset($d['email']) && $d['email'] !== '' ? (string) $d['email'] : null;
        if ($email !== null && Merchant::where('email', $email)->find()) {
            throw new BizException(Code::STATE_INVALID, '邮箱已被使用');
        }

        $setting        = new SettingService();
        $requireInvite  = $setting->get('registration_require_invite', '0') === '1';
        $inviteCode     = isset($d['invite_code']) ? trim((string) $d['invite_code']) : '';

        if ($requireInvite && $inviteCode === '') {
            throw new BizException(Code::PARAM_ERROR, '请填写邀请码');
        }

        $defaultRate = $setting->get('default_commission_rate', '0.0000') ?? '0.0000';

        try {
            $m = Db::transaction(function () use ($username, $email, $d, $defaultRate, $inviteCode) {
                // 同事务内先核销邀请码(行锁防并发超用),再建户;任一失败整体回滚。
                if ($inviteCode !== '') {
                    (new InviteCodeService())->redeem($inviteCode);
                }

                return Merchant::create([
                    'username'        => $username,
                    'password'        => password_hash((string) $d['password'], PASSWORD_BCRYPT),
                    'email'           => $email,
                    'store_name'      => (string) $d['store_name'],
                    'store_slug'      => $this->uniqueSlug(),
                    'status'          => Merchant::STATUS_PENDING,
                    'balance'         => '0.00',
                    'frozen_balance'  => '0.00',
                    'deposit'         => '0.00',
                    'verified'        => 0,
                    'commission_rate' => $defaultRate,
                ]);
            });
        } catch (\think\db\exception\PDOException $e) {
            throw $this->mapUniqueViolation($e);
        } catch (\PDOException $e) {
            throw $this->mapUniqueViolation($e);
        }

        return ['merchant_id' => (int) $m->id, 'status' => (int) $m->status];
    }

    /**
     * 将数据库唯一键冲突(SQLSTATE 23000 / 错误码 1062)映射为业务异常,
     * 以应对并发注册的 TOCTOU(先查后插之间被他人抢插)场景;
     * 其它数据库错误原样抛出,不掩盖真实故障。
     *
     * @return \Throwable 待抛出的异常(业务异常或原异常)
     */
    private function mapUniqueViolation(\Throwable $e): \Throwable
    {
        if ($this->isUniqueViolation($e)) {
            return new BizException(Code::STATE_INVALID, '用户名或邮箱已被使用', $e);
        }
        return $e;
    }

    /** 判断异常是否为唯一键冲突(SQLSTATE 23000 或 MySQL 错误码 1062) */
    private function isUniqueViolation(\Throwable $e): bool
    {
        // 原生 \PDOException:getCode() 即 SQLSTATE,errorInfo[1] 为驱动错误码。
        if ($e instanceof \PDOException) {
            if ((string) $e->getCode() === '23000') {
                return true;
            }
            if (isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1062) {
                return true;
            }
        }
        // ThinkPHP 的 PDOException 重新封装原异常,SQLSTATE/驱动码存于 getData()。
        if ($e instanceof \think\Exception) {
            $info = $e->getData()['PDO Error Info'] ?? null;
            if (is_array($info)) {
                if ((string) ($info['SQLSTATE'] ?? '') === '23000') {
                    return true;
                }
                if ((int) ($info['Driver Error Code'] ?? 0) === 1062) {
                    return true;
                }
            }
        }
        // 兜底:逐层检查 previous 中的 1062。
        for ($cur = $e->getPrevious(); $cur !== null; $cur = $cur->getPrevious()) {
            if ($cur instanceof \PDOException && isset($cur->errorInfo[1]) && (int) $cur->errorInfo[1] === 1062) {
                return true;
            }
        }
        return false;
    }

    /** 生成唯一的 store_slug(随机串,冲突重试) */
    private function uniqueSlug(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $slug = 's' . bin2hex(random_bytes(8));
            if (!Merchant::where('store_slug', $slug)->find()) {
                return $slug;
            }
        }
        throw new BizException(Code::STATE_INVALID, '店铺标识生成失败,请重试');
    }

    /** 店铺装修可由商户编辑的字段(deposit/verified 平台控,不在此列) */
    private const SHOP_EDITABLE = ['logo', 'cover', 'intro', 'announcement', 'contact_qq', 'contact_wechat', 'contact_mobile', 'theme'];

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
            'theme'          => $m->theme ?: 'default',
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
        // 主题须为平台预设 key,非法回退 default
        if (array_key_exists('theme', $patch) && !in_array((string) $patch['theme'], Merchant::THEMES, true)) {
            $patch['theme'] = 'default';
        }
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
