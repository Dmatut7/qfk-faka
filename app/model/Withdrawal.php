<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户提现单。
 */
class Withdrawal extends Model
{
    protected $name = 'withdrawals';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_PENDING  = 0; // 待审
    public const STATUS_APPROVED = 1; // 通过
    public const STATUS_REJECTED = 2; // 拒绝
    public const STATUS_PAID     = 3; // 已打款
}
