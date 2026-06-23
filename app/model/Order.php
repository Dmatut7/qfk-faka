<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 订单。状态机:0待支付→1已支付→2已发货;0→3关闭;2→4退款。
 * 金额字段以字符串保留 DECIMAL 精度,运算走 app\util\Money。
 */
class Order extends Model
{
    protected $name = 'orders';

    /**
     * 序列化时隐藏的敏感字段(security hunt #6/#7/#9)。
     * query_password 是买家查单密码的 bcrypt 哈希,绝不可经 toArray()/JSON 下发
     * (商户/平台订单列表与详情都会序列化订单)——泄漏后可离线爆破再冒充买家查单取卡。
     * 注:模型属性访问(BuyerOrderService 直接读 $order->query_password 校验)不受 $hidden 影响。
     */
    protected $hidden = ['query_password'];

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'product_id'  => 'integer',
        'goods_type'  => 'integer',
        'coupon_id'   => 'integer',
        'quantity'    => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_PENDING   = 0; // 待支付
    public const STATUS_PAID      = 1; // 已支付
    public const STATUS_DELIVERED = 2; // 已发货
    public const STATUS_CLOSED    = 3; // 已关闭 / 过期
    public const STATUS_REFUNDED  = 4; // 已退款
    public const STATUS_EXCEPTION = 5; // 异常待人工(超时后支付/卡不足,见 spec §10.4)
}
