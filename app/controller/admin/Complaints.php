<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\ComplaintService;

/**
 * 平台后台:投诉仲裁(受 AdminAuth 保护)。可裁决解决(联动退款)或驳回。
 */
class Complaints extends BaseApiController
{
    public function index(ComplaintService $svc)
    {
        $status = $this->input('status');
        $status = ($status === null || $status === '') ? null : (int) $status;
        $mid = $this->input('merchant_id');
        $mid = ($mid === null || $mid === '') ? null : (int) $mid;
        return $this->success(['items' => $svc->adminList($status, $mid)]);
    }

    public function resolve(ComplaintService $svc, $id)
    {
        $remark = (string) $this->input('remark', '');
        $refund = (int) $this->input('refund', 0) === 1;
        $c = $svc->adminResolve((int) $id, $remark, $refund);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status, 'refunded' => (int) $c->refunded]);
    }

    public function reject(ComplaintService $svc, $id)
    {
        $remark = (string) $this->input('remark', '');
        $c = $svc->adminReject((int) $id, $remark);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status]);
    }
}
