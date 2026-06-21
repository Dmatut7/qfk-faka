<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;

/**
 * 平台管理员资料(受 AdminAuth 保护)。
 */
class Profile extends BaseApiController
{
    public function me()
    {
        $admin = $this->request->admin;
        return $this->success([
            'id'       => (int) $admin->id,
            'username' => $admin->username,
            'nickname' => $admin->nickname,
            'status'   => (int) $admin->status,
        ]);
    }
}
