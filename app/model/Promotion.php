<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户订单级促销:满减(满 threshold 减 value)/ 满折(满 threshold 打 value 折,90=九折)。
 * 自动生效;与优惠券「互斥取最优」(见 OrderService 结算)。
 */
class Promotion extends Model
{
    protected $name = 'promotions';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'type'        => 'integer',
        'status'      => 'integer',
    ];

    public const TYPE_FULL_REDUCE   = 1; // 满减
    public const TYPE_FULL_DISCOUNT = 2; // 满折
    public const TYPES = [self::TYPE_FULL_REDUCE, self::TYPE_FULL_DISCOUNT];

    public const STATUS_OFF = 0;
    public const STATUS_ON  = 1;
}
