<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantService;

/**
 * 商户资料 / 自助改密(受 MerchantAuth 保护)。
 */
class Profile extends BaseApiController
{
    public function me()
    {
        $m = $this->currentMerchant();
        return $this->success([
            'id'              => (int) $m->id,
            'username'        => $m->username,
            'store_name'      => $m->store_name,
            'store_slug'      => $m->store_slug,
            'balance'         => $m->balance,
            'frozen_balance'  => $m->frozen_balance,
            'commission_rate' => $m->commission_rate,
            'status'          => (int) $m->status,
        ]);
    }

    public function changePassword(MerchantService $svc)
    {
        $data = $this->params(['old_password', 'new_password']);
        $this->validate($data, [
            'old_password' => 'require',
            'new_password' => 'require|min:6',
        ], [
            'new_password.min' => '新密码至少 6 位',
        ]);

        $svc->changePassword($this->authId(), $data['old_password'], $data['new_password']);
        return $this->success();
    }
}
