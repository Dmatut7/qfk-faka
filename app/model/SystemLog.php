<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 系统日志(只增不改的运维留痕)。无 update_time。
 * context 为 JSON 结构化上下文;level 取 info/warning/error。
 */
class SystemLog extends Model
{
    protected $name = 'system_logs';

    /** 日志只写不改,关闭 update_time */
    protected $updateTime = false;

    protected $type = [
        'id'      => 'integer',
        'context' => 'json',
    ];

    public const LEVEL_INFO    = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_ERROR   = 'error';
}
