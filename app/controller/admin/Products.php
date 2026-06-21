<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminViewService;

/**
 * 平台后台:跨商户商品只读视图(受 AdminAuth 保护)。
 */
class Products extends BaseApiController
{
    public function index(AdminViewService $svc)
    {
        $filter = $this->params(['merchant_id', 'status', 'keyword']);
        return $this->success($svc->products($filter, (int) $this->input('page', 1)));
    }
}
