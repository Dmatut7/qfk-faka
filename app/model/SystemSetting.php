<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 平台配置(KV)。字段 setting_key / setting_value。
 */
class SystemSetting extends Model
{
    protected $name = 'system_settings';

    protected $type = [
        'id' => 'integer',
    ];
}
