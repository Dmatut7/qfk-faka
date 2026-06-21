<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 登录令牌(多态:admin/merchant/buyer)。仅存哈希,只写不改。
 */
class AccessToken extends Model
{
    protected $name = 'access_tokens';

    /** 令牌不更新,关闭 update_time */
    protected $updateTime = false;

    protected $type = [
        'id'       => 'integer',
        'owner_id' => 'integer',
    ];

    public const OWNER_ADMIN    = 'admin';
    public const OWNER_MERCHANT = 'merchant';
    public const OWNER_BUYER    = 'buyer';
}
