<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Order;

/**
 * 买家前台订单查询:order_no + 邮箱核验后返回状态;仅已发货才返回卡密。
 */
class BuyerOrderService
{
    public function query(string $orderNo, string $email): array
    {
        $order = Order::where('order_no', $orderNo)->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        if (strcasecmp((string) $order->buyer_email, trim($email)) !== 0) {
            throw new BizException(Code::FORBIDDEN, '邮箱与订单不匹配');
        }

        $data = [
            'order_no'     => $order->order_no,
            'status'       => (int) $order->status,
            'product_id'   => (int) $order->product_id,
            'quantity'     => (int) $order->quantity,
            'total_amount' => $order->total_amount,
            'created_at'   => $order->create_time,
            'paid_at'      => $order->paid_at,
            'delivered_at' => $order->delivered_at,
            'cards'        => [],
        ];

        // 仅已发货订单返回卡密;待支付/已关闭一律不泄露
        if ((int) $order->status === Order::STATUS_DELIVERED) {
            $data['cards'] = Card::where('order_id', $order->id)
                ->where('status', Card::STATUS_SOLD)
                ->column('secret');
            $data['delivered_content'] = $order->delivered_content;
        }

        return $data;
    }
}
