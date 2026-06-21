<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Merchant;

/**
 * 平台侧商户管理(创建;审核/冻结等见 M8)。
 */
class AdminMerchantService
{
    /**
     * 平台创建商户账号(直接置为正常状态)。
     */
    public function create(array $d): Merchant
    {
        if (Merchant::where('username', $d['username'])->find()) {
            throw new BizException(Code::STATE_INVALID, '用户名已存在');
        }
        if (Merchant::where('store_slug', $d['store_slug'])->find()) {
            throw new BizException(Code::STATE_INVALID, '店铺标识已存在');
        }
        if (!empty($d['email']) && Merchant::where('email', $d['email'])->find()) {
            throw new BizException(Code::STATE_INVALID, '邮箱已被使用');
        }

        return Merchant::create([
            'username'        => $d['username'],
            'password'        => password_hash($d['password'], PASSWORD_BCRYPT),
            'email'           => $d['email'] ?? null,
            'phone'           => $d['phone'] ?? null,
            'store_name'      => $d['store_name'],
            'store_slug'      => $d['store_slug'],
            'status'          => Merchant::STATUS_ACTIVE,
            'commission_rate' => $d['commission_rate'] ?? '0.0000',
        ]);
    }
}
