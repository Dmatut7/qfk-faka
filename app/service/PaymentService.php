<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Order;
use app\model\Payment;
use app\service\pay\PayManager;
use app\util\OrderNo;

/**
 * 支付服务:发起支付(本类),回调处理见 NotifyService。
 */
class PaymentService
{
    /**
     * 发起支付:校验订单可支付 + 渠道启用,创建支付单,构建支付参数。
     */
    public function initiate(string $orderNo, string $channelCode, string $notifyUrl = '', string $returnUrl = ''): array
    {
        $order = Order::where('order_no', $orderNo)->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        $status = (int) $order->status;
        if ($status === Order::STATUS_PAID || $status === Order::STATUS_DELIVERED) {
            throw new BizException(Code::ORDER_PAID, '订单已支付');
        }
        if ($status !== Order::STATUS_PENDING) {
            throw new BizException(Code::ORDER_CLOSED, '订单已关闭');
        }
        if (strtotime($order->expire_at) < time()) {
            throw new BizException(Code::ORDER_CLOSED, '订单已过期');
        }

        $mgr     = new PayManager();
        $channel = $mgr->enabledChannel($channelCode); // 不存在/停用 → 5002
        $driver  = $mgr->driver($channelCode);

        $paymentNo = OrderNo::generate('PAY');
        Payment::create([
            'payment_no'  => $paymentNo,
            'order_id'    => $order->id,
            'merchant_id' => $order->merchant_id,
            'channel'     => $channelCode,
            'amount'      => $order->total_amount,
            'status'      => Payment::STATUS_PENDING,
        ]);

        Order::where('id', $order->id)->update(['pay_channel' => $channelCode]);

        $pay = $driver->buildPay([
            'out_trade_no' => $paymentNo,
            'amount'       => $order->total_amount,
            'subject'      => '订单 ' . $order->order_no,
            'notify_url'   => $notifyUrl,
            'return_url'   => $returnUrl,
        ], (array) $channel->config);

        return ['payment_no' => $paymentNo, 'pay' => $pay];
    }
}
