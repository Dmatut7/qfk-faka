<?php
declare(strict_types=1);

namespace tests\Feature;

use app\service\SettingService;
use tests\TestCase;

/**
 * 平台公开配置接口 GET /config。
 *
 * 公开可访问(无需 token);返回 site / kefu / order_query_tips 结构;
 * 未设置的键返回空串不报错。
 */
class ConfigTest extends TestCase
{
    public function testConfigReturnsStructureWithSetValues(): void
    {
        $svc = new SettingService();
        $svc->set('site_title', '我的发卡站');
        $svc->set('kefu_qq', '10001');
        $svc->set('kefu_wechat', 'wx_kefu');
        $svc->set('kefu_mobile', '13800138000');
        $svc->set('kefu_qrcode', 'https://example.com/qr.png');
        $svc->set('order_query_tips', '请输入下单邮箱查询');

        $r = $this->callJson('GET', '/config');

        $this->assertSame(0, $r['code']);
        $this->assertSame('我的发卡站', $r['data']['site']['title']);
        $this->assertSame('我的发卡站', $r['data']['site']['name']);
        $this->assertSame('10001', $r['data']['kefu']['qq']);
        $this->assertSame('wx_kefu', $r['data']['kefu']['wechat']);
        $this->assertSame('13800138000', $r['data']['kefu']['mobile']);
        $this->assertSame('https://example.com/qr.png', $r['data']['kefu']['qrcode']);
        $this->assertSame('请输入下单邮箱查询', $r['data']['order_query_tips']);
    }

    public function testConfigDefaultsToEmptyStringsWhenUnset(): void
    {
        $r = $this->callJson('GET', '/config');

        $this->assertSame(0, $r['code']);
        $this->assertSame('', $r['data']['site']['title']);
        // site_title 缺省时 name 回落到默认「秒卡」
        $this->assertSame('秒卡', $r['data']['site']['name']);
        $this->assertSame('', $r['data']['kefu']['qq']);
        $this->assertSame('', $r['data']['kefu']['wechat']);
        $this->assertSame('', $r['data']['kefu']['mobile']);
        $this->assertSame('', $r['data']['kefu']['qrcode']);
        $this->assertSame('', $r['data']['order_query_tips']);
    }

    public function testConfigNameFallsBackWhenTitleSet(): void
    {
        // 只设置 site_title:name 应等于 site_title 而非默认值
        (new SettingService())->set('site_title', '专属标题');

        $r = $this->callJson('GET', '/config');
        $this->assertSame('专属标题', $r['data']['site']['name']);
    }

    public function testConfigIsPubliclyAccessibleWithoutToken(): void
    {
        // 不带任何鉴权头,应 200 且 code=0,而非 401
        $response = $this->call('GET', '/config');
        $this->assertSame(200, $response->getCode());

        $body = json_decode($response->getContent(), true);
        $this->assertSame(0, $body['code']);
        $this->assertArrayHasKey('site', $body['data']);
        $this->assertArrayHasKey('kefu', $body['data']);
        $this->assertArrayHasKey('order_query_tips', $body['data']);
    }

    public function testAdminSettingsCanWriteConfigKeys(): void
    {
        // 后台 setSetting 应能写入这些公开键(无白名单限制)
        $token = $this->makeAdminToken();
        $r = $this->callJson('POST', '/admin/settings', ['key' => 'site_title', 'value' => '后台设置标题'], $this->bearer($token));
        $this->assertSame(0, $r['code']);

        $r = $this->callJson('GET', '/config');
        $this->assertSame('后台设置标题', $r['data']['site']['title']);
        $this->assertSame('后台设置标题', $r['data']['site']['name']);
    }
}
