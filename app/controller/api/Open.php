<?php
declare(strict_types=1);

namespace app\controller\api;

use app\common\BizException;
use app\common\Code;
use app\controller\BaseApiController;
use app\model\Order;
use app\model\Product;

/**
 * 商户开放 API(MerchantApiAuth 签名鉴权)。只读:商品/库存、订单查询,仅限本商户数据。
 */
class Open extends BaseApiController
{
    /** 本商户商品 + 库存 */
    public function products()
    {
        $mid = (int) $this->request->authId;
        $items = Product::where('merchant_id', $mid)
            ->field('id,title,price,stock,status,goods_type')
            ->order('id', 'desc')->select()->toArray();

        return $this->success(['items' => $items]);
    }

    /** 按订单号查本商户订单状态(已发货则返回发货内容快照) */
    public function orderQuery()
    {
        $mid     = (int) $this->request->authId;
        $orderNo = trim((string) $this->input('order_no', ''));
        if ($orderNo === '') {
            throw new BizException(Code::PARAM_ERROR, 'order_no 必填');
        }
        $order = Order::where('merchant_id', $mid)->where('order_no', $orderNo)->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }

        return $this->success([
            'order_no'          => $order->order_no,
            'status'            => (int) $order->status,
            'total_amount'      => $order->total_amount,
            'quantity'          => (int) $order->quantity,
            'buyer_email'       => $order->buyer_email,
            'delivered_content' => (int) $order->status === Order::STATUS_DELIVERED ? (string) $order->delivered_content : '',
            'create_time'       => $order->create_time,
        ]);
    }
}
