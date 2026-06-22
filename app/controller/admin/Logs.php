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

    /** 风控记录:黑名单拦截 + 支付异常聚合 */
    public function risk(SystemLogService $svc)
    {
        return $this->success($svc->riskList((int) $this->input('page', 1)));
    }
}
