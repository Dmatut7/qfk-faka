<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\BuyerOrderService;
use app\service\OrderService;
use app\service\PaymentService;

/**
 * 买家前台:下单与订单查询(公开,游客可用)。
 */
class Order extends BaseApiController
{
    public function create(OrderService $svc)
    {
        $d = $this->params(['product_id', 'quantity', 'buyer_email', 'buyer_contact']);
        $this->validate($d, [
            'product_id'  => 'require|integer',
            'quantity'    => 'require|integer|egt:1',
            'buyer_email' => 'require|email',
        ], [
            'buyer_email.email' => '邮箱格式不正确',
        ]);

        $d['client_ip'] = $this->request->ip();
        $order = $svc->create($d);

        return $this->success([
            'order_no'     => $order->order_no,
            'total_amount' => $order->total_amount,
            'quantity'     => (int) $order->quantity,
            'expire_at'    => $order->expire_at,
            'status'       => (int) $order->status,
        ]);
    }

    public function pay(PaymentService $svc, $no)
    {
        $channel   = (string) $this->input('channel', 'epay');
        $notifyUrl = rtrim($this->request->domain(), '/') . '/pay/notify/' . $channel;
        $result    = $svc->initiate((string) $no, $channel, $notifyUrl, (string) $this->input('return_url', ''));
        return $this->success($result);
    }

    public function query(BuyerOrderService $svc)
    {
        $d = $this->params(['order_no', 'email']);
        $this->validate($d, [
            'order_no' => 'require',
            'email'    => 'require|email',
        ]);

        return $this->success($svc->query($d['order_no'], $d['email']));
    }
}
