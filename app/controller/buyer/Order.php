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
        $d = $this->params(['product_id', 'quantity', 'buyer_email', 'buyer_contact', 'query_password', 'coupon_code']);
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
            'order_no'        => $order->order_no,
            'total_amount'    => $order->total_amount,
            'original_amount' => $order->original_amount,
            'discount_amount' => $order->discount_amount,
            'coupon_code'     => $order->coupon_code,
            'quantity'        => (int) $order->quantity,
            'expire_at'       => $order->expire_at,
            'status'          => (int) $order->status,
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
        $d = $this->params(['order_no', 'email', 'password']);
        // 凭证二选一:邮箱 或 查单密码;具体核验在 Service 内完成
        $this->validate($d, [
            'order_no' => 'require',
        ]);

        return $this->success($svc->query(
            (string) $d['order_no'],
            isset($d['email']) ? (string) $d['email'] : null,
            isset($d['password']) ? (string) $d['password'] : null
        ));
    }
}
