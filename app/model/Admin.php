<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 平台管理员。
 */
class Admin extends Model
{
    protected $name = 'admins';

    /** 序列化时隐藏密码 */
    protected $hidden = ['password'];

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
    ];

    public const STATUS_DISABLED = 0;
    public const STATUS_ENABLED  = 1;
}
