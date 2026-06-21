<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 注册邀请码。status=1 启用 / 0 停用;max_uses=0 表示不限次数。
 * 当 status=1 且 (max_uses=0 或 used_count<max_uses) 时为「可用」。
 */
class InviteCode extends Model
{
    protected $name = 'invite_codes';

    // 表无 update_time 字段:仅维护 create_time
    protected $autoWriteTimestamp = true;
    protected $updateTime         = false;

    protected $type = [
        'id'         => 'integer',
        'status'     => 'integer',
        'max_uses'   => 'integer',
        'used_count' => 'integer',
    ];

    public const STATUS_DISABLED = 0;
    public const STATUS_ENABLED  = 1;

    public function isEnabled(): bool
    {
        return (int) $this->status === self::STATUS_ENABLED;
    }

    /** 是否仍有剩余可用次数(max_uses=0 视为不限) */
    public function hasRemaining(): bool
    {
        return (int) $this->max_uses === 0 || (int) $this->used_count < (int) $this->max_uses;
    }

    /** 是否当前可用于注册(启用 + 未用尽) */
    public function isUsable(): bool
    {
        return $this->isEnabled() && $this->hasRemaining();
    }
}
