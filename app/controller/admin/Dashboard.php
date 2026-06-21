<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminViewService;

/**
 * 平台后台:仪表盘聚合(受 AdminAuth 保护)。只读。
 */
class Dashboard extends BaseApiController
{
    /** GET admin/dashboard —— 平台总览聚合指标 */
    public function index(AdminViewService $svc)
    {
        return $this->success($svc->dashboard());
    }
}
