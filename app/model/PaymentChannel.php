<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 支付渠道配置。config 为 JSON(密钥/网关/sign_type 等)。
 */
class PaymentChannel extends Model
{
    protected $name = 'payment_channels';

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
        'sort'   => 'integer',
        'config' => 'json',
    ];

    public const STATUS_DISABLED = 0;
    public const STATUS_ENABLED  = 1;

    public function isEnabled(): bool
    {
        return (int) $this->status === self::STATUS_ENABLED;
    }
}
