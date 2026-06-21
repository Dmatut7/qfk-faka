<?php
declare(strict_types=1);

namespace app\controller;

use app\service\SettingService;
use think\response\Json;

/**
 * 平台公开配置接口(无鉴权)。
 *
 * 从 system_settings(KV)读取站点 / 客服 / 订单查询提示等公开配置,
 * 组装为前台可直接使用的结构。缺省键返回空串。
 */
class Config
{
    public function index(SettingService $svc): Json
    {
        $title = (string) $svc->get('site_title', '');
        // name 取 site_title,缺省默认「秒卡」
        $name = $title !== '' ? $title : '秒卡';

        return json([
            'code' => 0,
            'msg'  => 'ok',
            'data' => [
                'site' => [
                    'title' => $title,
                    'name'  => $name,
                ],
                'kefu' => [
                    'qq'     => (string) $svc->get('kefu_qq', ''),
                    'wechat' => (string) $svc->get('kefu_wechat', ''),
                    'mobile' => (string) $svc->get('kefu_mobile', ''),
                    'qrcode' => (string) $svc->get('kefu_qrcode', ''),
                ],
                'order_query_tips' => (string) $svc->get('order_query_tips', ''),
            ],
        ]);
    }
}
