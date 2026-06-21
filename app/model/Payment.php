<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 支付单/支付流水。回调幂等主根为订单行锁 + 状态重查,
 * uniq(channel,channel_trade_no) 仅二级兜底(spec §10.2/§10.4)。
 */
class Payment extends Model
{
    protected $name = 'payments';

    protected $type = [
        'id'          => 'integer',
        'order_id'    => 'integer',
        'merchant_id' => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_PENDING = 0; // 待支付
    public const STATUS_SUCCESS = 1; // 成功
    public const STATUS_FAILED  = 2; // 失败
}
