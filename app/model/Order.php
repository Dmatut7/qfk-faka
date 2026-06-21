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

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'product_id'  => 'integer',
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
