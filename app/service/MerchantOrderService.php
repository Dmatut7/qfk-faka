<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Order;

/**
 * 商户订单查看(列表/详情);关闭与补发委托 OrderService(复用发卡闸门)。
 */
class MerchantOrderService
{
    public function list(int $merchantId, array $filter, int $page = 1, int $size = 20): array
    {
        $q = Order::where('merchant_id', $merchantId);
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        if (!empty($filter['order_no'])) {
            $q->where('order_no', $filter['order_no']);
        }
        if (!empty($filter['buyer_email'])) {
            $q->where('buyer_email', $filter['buyer_email']);
        }
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    public function detail(int $merchantId, int $orderId): array
    {
        $order = $this->findOwned($merchantId, $orderId);
        $data  = $order->toArray();
        $data['cards'] = Card::where('order_id', $order->id)->order('id', 'asc')->column('secret');
        return $data;
    }

    public function findOwned(int $merchantId, int $orderId): Order
    {
        $o = Order::find($orderId);
        if (!$o) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        if ((int) $o->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人订单');
        }
        return $o;
    }
}
