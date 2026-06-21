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
    /** GET admin/settings —— 全部平台配置 */
    public function settings(SettingService $svc)
    {
        return $this->success(['items' => $svc->all()]);
    }

    /** POST admin/settings —— upsert 单个配置项 */
    public function setSetting(SettingService $svc)
    {
        $d = $this->params(['key', 'value']);
        $this->validate($d, [
            'key' => 'require|length:1,64',
        ]);
        $value = array_key_exists('value', $d) && $d['value'] !== null ? (string) $d['value'] : null;
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
