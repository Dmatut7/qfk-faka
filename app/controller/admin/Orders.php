<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminViewService;
use app\service\RefundService;

/**
 * 平台后台:跨商户订单视图 + 退款操作(受 AdminAuth 保护)。
 */
class Orders extends BaseApiController
{
    public function index(AdminViewService $svc)
    {
        $filter = $this->params(['merchant_id', 'status', 'order_no']);
        return $this->success($svc->orders($filter, (int) $this->input('page', 1)));
    }

    /** 平台退款:状态置退款 + 卡密回库 + 反向资金 + 优惠券反核销 */
    public function refund(RefundService $svc, $id)
    {
        $order = $svc->refund((int) $id, (string) $this->input('reason', ''));
        return $this->success([
            'id'          => (int) $order->id,
            'order_no'    => $order->order_no,
            'status'      => (int) $order->status,
            'refunded_at' => $order->refunded_at,
        ]);
    }
}
