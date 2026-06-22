<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 买家黑名单(平台级)。按邮箱(小写归一)拦截下单。status=1 生效。
 */
class BuyerBlacklist extends Model
{
    protected $name = 'buyer_blacklist';

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
    ];

    public const STATUS_OFF = 0; // 已解除
    public const STATUS_ON  = 1; // 生效中
}
