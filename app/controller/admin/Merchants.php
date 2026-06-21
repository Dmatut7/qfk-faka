<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminMerchantService;

/**
 * 平台后台:商户管理(受 AdminAuth 保护)。
 */
class Merchants extends BaseApiController
{
    public function index(AdminMerchantService $svc)
    {
        $filter = $this->params(['keyword', 'status']);
        return $this->success($svc->list($filter, (int) $this->input('page', 1)));
    }

    public function create(AdminMerchantService $svc)
    {
        $data = $this->params(['username', 'password', 'email', 'phone', 'store_name', 'store_slug', 'commission_rate']);
        $this->validate($data, [
            'username'   => 'require|length:3,64',
            'password'   => 'require|min:6',
            'store_name' => 'require|max:128',
            'store_slug' => 'require|alphaDash|max:64',
        ], [
            'store_slug.alphaDash' => '店铺标识只能是字母/数字/下划线/破折号',
        ]);

        $m = $svc->create($data);

        return $this->success([
            'id'         => (int) $m->id,
            'username'   => $m->username,
            'store_slug' => $m->store_slug,
            'status'     => (int) $m->status,
        ]);
    }

    public function approve(AdminMerchantService $svc, $id)
    {
        return $this->success(['status' => (int) $svc->approve((int) $id)->status]);
    }

    public function freeze(AdminMerchantService $svc, $id)
    {
        return $this->success(['status' => (int) $svc->freeze((int) $id)->status]);
    }

    public function unfreeze(AdminMerchantService $svc, $id)
    {
        return $this->success(['status' => (int) $svc->unfreeze((int) $id)->status]);
    }

    public function setCommission(AdminMerchantService $svc, $id)
    {
        $rate = (string) $this->input('commission_rate', '');
        return $this->success(['commission_rate' => $svc->setCommission((int) $id, $rate)->commission_rate]);
    }

    public function resetPassword(AdminMerchantService $svc, $id)
    {
        $data = $this->params(['new_password']);
        $this->validate($data, ['new_password' => 'require|min:6']);
        $svc->resetPassword((int) $id, $data['new_password']);
        return $this->success();
    }
}
