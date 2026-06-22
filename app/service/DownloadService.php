<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Order;
use app\model\Product;

/**
 * 资源类下载防盗链:对已发货的资源订单签发「限时签名链」,经本服务校验后 302 跳真实地址。
 * 签名 = HMAC-SHA256(order_no|expires, secret);真实 resource_url 不直接暴露,链接过期即失效。
 */
class DownloadService
{
    /** 签名链默认有效期(秒) */
    public const TTL = 1800; // 30 分钟

    private function secret(): string
    {
        $k = (string) (getenv('DOWNLOAD_SECRET') ?: '');
        if ($k !== '') {
            return $k;
        }
        // 回退:用应用配置或固定盐(生产应在 .env 配 DOWNLOAD_SECRET)
        $appKey = (string) config('app.app_key');
        return $appKey !== '' ? $appKey : 'qfk_download_salt_v1';
    }

    private function sign(string $orderNo, int $expires): string
    {
        return hash_hmac('sha256', $orderNo . '|' . $expires, $this->secret());
    }

    /** 为订单签发限时下载链路径(相对路径,前端拼域名)。返回 null 表示该订单不可下载。 */
    public function issueLink(Order $order): ?string
    {
        if ((int) $order->status !== Order::STATUS_DELIVERED) {
            return null;
        }
        if ((int) $order->goods_type !== Product::GOODS_TYPE_RESOURCE) {
            return null;
        }
        $expires = time() + self::TTL;
        $token   = $this->sign((string) $order->order_no, $expires);
        return '/buyer/download/' . rawurlencode((string) $order->order_no) . '?expires=' . $expires . '&token=' . $token;
    }

    /**
     * 校验签名链并返回真实下载地址。失败抛 BizException(过期/签名错/订单非法/无资源)。
     */
    public function resolve(string $orderNo, int $expires, string $token): string
    {
        if ($expires < time()) {
            throw new BizException(Code::STATE_INVALID, '下载链接已过期,请重新查单获取');
        }
        if (!hash_equals($this->sign($orderNo, $expires), $token)) {
            throw new BizException(Code::FORBIDDEN, '下载链接无效');
        }
        $order = Order::where('order_no', $orderNo)->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        if ((int) $order->status !== Order::STATUS_DELIVERED || (int) $order->goods_type !== Product::GOODS_TYPE_RESOURCE) {
            throw new BizException(Code::STATE_INVALID, '该订单不可下载');
        }
        $product = Product::find($order->product_id);
        $url = $product ? (string) $product->resource_url : '';
        if ($url === '') {
            throw new BizException(Code::NOT_FOUND, '资源地址未配置,请联系商家');
        }
        return $url;
    }
}
