<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户优惠券。type 满减/折扣;value 满减为减额、折扣为百分比(90=九折)。
 * 计价与核销口径见 CouponService(bcmath,防 0 元单)。
 */
class Coupon extends Model
{
    protected $name = 'coupons';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'type'        => 'integer',
        'total'       => 'integer',
        'used'        => 'integer',
        'status'      => 'integer',
    ];

    public const TYPE_AMOUNT  = 1; // 满减(满 min_amount 减 value)
    public const TYPE_PERCENT = 2; // 折扣(打 value 折,value=90 即九折)

    public const TYPES = [self::TYPE_AMOUNT, self::TYPE_PERCENT];

    public const STATUS_OFF = 0;
    public const STATUS_ON  = 1;

    public function isEnabled(): bool
    {
        return (int) $this->status === self::STATUS_ON;
    }
}
