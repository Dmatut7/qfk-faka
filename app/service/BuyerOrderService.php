<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Order;

/**
 * 买家前台订单查询:order_no + 凭证(邮箱 或 查单密码)核验后返回状态;仅已发货才返回卡密。
 * 凭证二选一:传 password 用查单密码核验(需下单时设置),否则用邮箱核验。
 */
class BuyerOrderService
{
    public function query(string $orderNo, ?string $email = null, ?string $password = null): array
    {
        $order = Order::where('order_no', $orderNo)->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        $this->verifyCredential($order, $email, $password);

        $data = [
            'order_no'     => $order->order_no,
            'status'       => (int) $order->status,
            'product_id'   => (int) $order->product_id,
            'goods_type'   => (int) ($order->goods_type ?? 1),
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
            // 资源类:签发限时防盗链下载地址(真实地址不直接暴露)
            $link = (new DownloadService())->issueLink($order);
            if ($link !== null) {
                $data['download_url'] = $link;
            }
        }

        return $data;
    }

    /**
     * 定位并核验订单归属(供查单/投诉/章节阅读等复用)。凭证二选一:邮箱或查单密码。
     */
    public function verifiedOrder(string $orderNo, ?string $email = null, ?string $password = null): Order
    {
        $order = Order::where('order_no', trim($orderNo))->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        $this->verifyCredential($order, $email, $password);
        return $order;
    }

    /**
     * 凭证核验:优先查单密码,其次邮箱。两者皆缺则参数错误。
     * - password 非空:订单须已设置 query_password 且 bcrypt 校验通过,否则 403。
     * - 否则用 email 大小写不敏感匹配 buyer_email,不符 403。
     */
    private function verifyCredential(Order $order, ?string $email, ?string $password): void
    {
        $pwd = trim((string) $password);
        if ($pwd !== '') {
            $hash = (string) $order->query_password;
            if ($hash === '' || !password_verify($pwd, $hash)) {
                throw new BizException(Code::FORBIDDEN, '查单密码不正确');
            }
            return;
        }

        $mail = trim((string) $email);
        if ($mail === '') {
            throw new BizException(Code::PARAM_ERROR, '请提供邮箱或查单密码');
        }
        if (strcasecmp((string) $order->buyer_email, $mail) !== 0) {
            throw new BizException(Code::FORBIDDEN, '邮箱与订单不匹配');
        }
    }
}
