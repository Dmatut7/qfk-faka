<?php
declare(strict_types=1);

namespace app\service\pay;

/**
 * 支付渠道驱动接口。
 *
 * 每个第三方渠道(易支付/支付宝/微信…)实现本接口;平台只通过该抽象交互。
 * 安全要点:回调的唯一信任根是 verify()(验签),其余字段一律不可信。
 */
interface PayDriverInterface
{
    /**
     * 构建支付请求(用于前端跳转 / 二维码)。
     *
     * @param array $order  ['out_trade_no','amount','subject','notify_url','return_url'?,'type'?]
     * @param array $config 渠道配置(pid/key/gateway 等)
     * @return array ['method'=>'GET'|'POST','url'=>string,'params'=>array]
     */
    public function buildPay(array $order, array $config): array;

    /**
     * 验签:回调参数签名是否合法。伪造/篡改一律返回 false。
     */
    public function verify(array $params, array $config): bool;

    /**
     * 解析回调为标准结构。
     *
     * @return array ['out_trade_no'=>string,'channel_trade_no'=>string,'amount'=>string,'success'=>bool]
     */
    public function parse(array $params): array;

    /** 处理成功后返回给渠道的应答(令其停止重试) */
    public function successResponse(): string;

    /** 处理失败 / 验签失败返回给渠道的应答(令其重试或终止) */
    public function failResponse(): string;
}
