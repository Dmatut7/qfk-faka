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
}
