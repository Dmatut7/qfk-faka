<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户。余额/冻结/佣金率以字符串保留 DECIMAL 精度,金额运算走 app\util\Money。
 */
class Merchant extends Model
{
    protected $name = 'merchants';

    protected $hidden = ['password', 'api_secret'];

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
    ];

    public const STATUS_PENDING = 0; // 待审核
    public const STATUS_ACTIVE  = 1; // 正常
    public const STATUS_FROZEN  = 2; // 冻结

    public function isActive(): bool
    {
        return (int) $this->status === self::STATUS_ACTIVE;
    }
}
