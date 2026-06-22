<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 平台禁售目录项。status=1 展示;按 category 分组、sort 倒序展示。
 */
class ForbiddenItem extends Model
{
    protected $name = 'forbidden_items';

    protected $type = [
        'id'     => 'integer',
        'sort'   => 'integer',
        'status' => 'integer',
    ];

    public const STATUS_HIDDEN = 0;
    public const STATUS_SHOWN  = 1;
}
