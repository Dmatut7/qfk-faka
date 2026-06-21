<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 卡密(库存核心)。状态机:0未售→1锁定→2已售;1→0 释放;0→3 作废。
 * 并发安全的"一卡一售"取卡逻辑见 spec §6/§10.3,由 CardService 实现。
 */
class Card extends Model
{
    protected $name = 'cards';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'product_id'  => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_UNSOLD   = 0; // 未售
    public const STATUS_LOCKED   = 1; // 锁定(下单预占)
    public const STATUS_SOLD     = 2; // 已售(支付成功)
    public const STATUS_DISABLED = 3; // 作废

    /** 计算卡密去重指纹 */
    public static function hashSecret(string $secret): string
    {
        return hash('sha256', $secret);
    }
}
