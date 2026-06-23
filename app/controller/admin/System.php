<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminReportService;
use app\service\SettingService;

/**
 * 平台后台:系统配置读写 + 对账报表(受 AdminAuth 保护)。
 */
class System extends BaseApiController
{
    /** 敏感配置键:GET 不回传明文,POST 留空表示「不修改」(防泄漏/防误清)。 */
    private const SENSITIVE_KEYS = ['smtp_pass'];

    /** GET admin/settings —— 全部平台配置(敏感键脱敏) */
    public function settings(SettingService $svc)
    {
        $items = $svc->all();
        foreach (self::SENSITIVE_KEYS as $k) {
            $items[$k . '_set'] = isset($items[$k]) && (string) $items[$k] !== '';
            unset($items[$k]); // 绝不下发明文密钥
        }
        return $this->success(['items' => $items]);
    }

    /** POST admin/settings —— upsert 单个配置项 */
    public function setSetting(SettingService $svc)
    {
        $d = $this->params(['key', 'value']);
        $this->validate($d, [
            'key' => 'require|length:1,64',
        ]);
        $value = array_key_exists('value', $d) && $d['value'] !== null ? (string) $d['value'] : null;
        // 敏感键留空 = 不修改(沿用原值),避免保存表单时把已配置的密钥清空
        if (in_array((string) $d['key'], self::SENSITIVE_KEYS, true) && ($value === null || $value === '')) {
            return $this->success(['key' => $d['key'], 'value' => '(unchanged)']);
        }
        $svc->set((string) $d['key'], $value);

        return $this->success(['key' => $d['key'], 'value' => $value]);
    }

    /** GET admin/reports/settlement —— 跨商户对账汇总 */
    public function settlementReport(AdminReportService $svc)
    {
        $start = (string) $this->input('start', '');
        $end   = (string) $this->input('end', '');

        return $this->success($svc->settlementReport($start, $end));
    }
}
