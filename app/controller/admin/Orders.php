<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminViewService;

/**
 * 平台后台:跨商户订单只读视图(受 AdminAuth 保护)。
 */
class Orders extends BaseApiController
{
    public function index(AdminViewService $svc)
    {
        $filter = $this->params(['merchant_id', 'status', 'order_no']);
        return $this->success($svc->orders($filter, (int) $this->input('page', 1)));
    }
}
