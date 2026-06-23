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
        $page = max(1, (int) ($this->input('page') ?: 1));
        $res = $svc->adminList($status, $mid, $page);
        return $this->success([
            'items'         => $res['items'],
            'total'         => $res['total'],
            'page'          => $res['page'],
            'status_counts' => $res['status_counts'],
        ]);
    }

    public function resolve(ComplaintService $svc, $id)
    {
        $remark = (string) $this->input('remark', '');
        $refund = (int) $this->input('refund', 0) === 1;
        $c = $svc->adminResolve((int) $id, $remark, $refund);
        $this->audit('complaint_resolve', '裁决解决投诉 #' . $c->id . ($refund ? '(退款)' : ''), ['complaint_id' => (int) $c->id, 'order_no' => $c->order_no, 'refunded' => (int) $c->refunded, 'remark' => $remark]);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status, 'refunded' => (int) $c->refunded]);
    }

    public function reject(ComplaintService $svc, $id)
    {
        $remark = (string) $this->input('remark', '');
        $c = $svc->adminReject((int) $id, $remark);
        $this->audit('complaint_reject', '驳回投诉 #' . $c->id, ['complaint_id' => (int) $c->id, 'order_no' => $c->order_no, 'remark' => $remark]);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status]);
    }
}
