<?php
declare(strict_types=1);

namespace app\service;

use app\model\SystemSetting;

/**
 * 平台配置(KV)读写。底层 SystemSetting 模型,字段 setting_key / setting_value(uniq_key 唯一)。
 * set 为 upsert(存在则更新,不存在则新建)。
 */
class SettingService
{
    public function get(string $key, ?string $default = null): ?string
    {
        $row = SystemSetting::where('setting_key', $key)->find();
        return $row ? (string) $row->setting_value : $default;
    }

    /** upsert:按 setting_key 唯一,存在则更新 setting_value,否则插入 */
    public function set(string $key, ?string $value): SystemSetting
    {
        $row = SystemSetting::where('setting_key', $key)->find();
        if ($row) {
            $row->save(['setting_value' => $value]);
            return $row;
        }
        return SystemSetting::create([
            'setting_key'   => $key,
            'setting_value' => $value,
        ]);
    }

    /** 全部配置,返回 key => value 映射 */
    public function all(): array
    {
        $out = [];
        foreach (SystemSetting::select() as $row) {
            $out[$row->setting_key] = $row->setting_value;
        }
        return $out;
    }
}
