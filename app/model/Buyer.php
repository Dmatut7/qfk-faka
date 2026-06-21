<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 买家(可选账号)。游客下单不强制建账号。
 */
class Buyer extends Model
{
    protected $name = 'buyers';

    protected $hidden = ['password'];

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
    ];

    public const STATUS_DISABLED = 0;
    public const STATUS_NORMAL   = 1;
}
