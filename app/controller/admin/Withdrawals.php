<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminWithdrawService;

/**
 * 平台后台:提现审核(受 AdminAuth 保护)。
 */
class Withdrawals extends BaseApiController
{
    public function index(AdminWithdrawService $svc)
    {
        $filter = $this->params(['status', 'merchant_id']);
        return $this->success($svc->list($filter, (int) $this->input('page', 1)));
    }

    public function approve(AdminWithdrawService $svc, $id)
    {
        $w = $svc->approve((int) $id);
        return $this->success(['id' => (int) $w->id, 'status' => (int) $w->status]);
    }

    public function reject(AdminWithdrawService $svc, $id)
    {
        $w = $svc->reject((int) $id);
        return $this->success(['id' => (int) $w->id, 'status' => (int) $w->status]);
    }
}
