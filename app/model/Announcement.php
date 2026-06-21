<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 平台公告。status=1 显示 / 0 隐藏;按 sort 倒序展示。
 */
class Announcement extends Model
{
    protected $name = 'announcements';

    protected $type = [
        'id'     => 'integer',
        'status' => 'integer',
        'sort'   => 'integer',
    ];

    public const STATUS_HIDDEN = 0;
    public const STATUS_SHOWN  = 1;

    /** 店铺前台展示的最大公告条数 */
    public const STORE_LIMIT = 5;

    public function isShown(): bool
    {
        return (int) $this->status === self::STATUS_SHOWN;
    }
}
