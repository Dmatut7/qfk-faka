<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\SystemLogService;

/**
 * 平台后台:系统日志查询(受 AdminAuth 保护)。
 * GET /admin/logs?type=&level=&page=
 */
class Logs extends BaseApiController
{
    public function index(SystemLogService $svc)
    {
        $filter = $this->params(['type', 'level']);
        return $this->success($svc->list($filter, (int) $this->input('page', 1)));
    }
}
