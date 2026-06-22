<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 订单投诉/售后工单。状态机:
 * 0待商户处理 →(商户回复)1商户已回复 →(买家申请介入)2平台介入中 →(平台裁决)3已解决 / 4已驳回。
 * 商户/平台亦可直接解决或驳回。已解决可联动退款(refunded=1)。
 */
class Complaint extends Model
{
    protected $name = 'complaints';

    protected $type = [
        'id'          => 'integer',
        'order_id'    => 'integer',
        'merchant_id' => 'integer',
        'type'        => 'integer',
        'status'      => 'integer',
        'refunded'    => 'integer',
    ];

    // 投诉类型
    public const TYPE_NOT_RECEIVED = 1; // 未收到货
    public const TYPE_INVALID_CARD = 2; // 卡密无效
    public const TYPE_MISMATCH     = 3; // 描述不符
    public const TYPE_OTHER        = 4; // 其他
    public const TYPES = [self::TYPE_NOT_RECEIVED, self::TYPE_INVALID_CARD, self::TYPE_MISMATCH, self::TYPE_OTHER];

    // 状态
    public const STATUS_OPEN      = 0; // 待商户处理
    public const STATUS_REPLIED   = 1; // 商户已回复
    public const STATUS_INTERVENE = 2; // 平台介入中
    public const STATUS_RESOLVED  = 3; // 已解决
    public const STATUS_REJECTED  = 4; // 已驳回

    /** 进行中(未终结)的状态,可被回复/介入/裁决 */
    public const ACTIVE = [self::STATUS_OPEN, self::STATUS_REPLIED, self::STATUS_INTERVENE];

    public function isActive(): bool
    {
        return in_array((int) $this->status, self::ACTIVE, true);
    }
}
