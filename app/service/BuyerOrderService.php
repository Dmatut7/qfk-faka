<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
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

        // 仅已发货订单返回卡密,且以发货事务内原子写入的 delivered_content 快照为
        // 唯一真相源(不再实时查 cards,避免两份不一致、缩小明文暴露面)。待支付/已关闭不泄露。
        if ((int) $order->status === Order::STATUS_DELIVERED) {
            $content = (string) $order->delivered_content;
            $data['cards'] = $content === ''
                ? []
                : array_values(array_filter(array_map('trim', explode("\n", $content)), static fn($l) => $l !== ''));
            $data['delivered_content'] = $order->delivered_content;
        }

        return $data;
    }
}
