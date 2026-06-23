<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Product;
use app\service\AdminReportService;
use app\service\SettingService;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 平台配置读写 + 对账报表 (T8.4)。
 */
class AdminSettingReportTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->token = $this->makeAdminToken();
    }

    private function hdr(): array
    {
        return $this->bearer($this->token);
    }

    /** 创建一笔指定商户/状态/金额的订单 */
    private function order(int $merchantId, int $productId, int $status, string $amount): Order
    {
        return Order::create([
            'order_no'     => OrderNo::generate(),
            'merchant_id'  => $merchantId,
            'product_id'   => $productId,
            'buyer_email'  => 'b@example.com',
            'quantity'     => 1,
            'unit_price'   => $amount,
            'total_amount' => $amount,
            'status'       => $status,
            'expire_at'    => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    private function commissionLog(int $merchantId, string $negAmount): void
    {
        MerchantFundLog::create([
            'merchant_id'   => $merchantId,
            'type'          => MerchantFundLog::TYPE_COMMISSION,
            'amount'        => $negAmount,
            'balance_after' => '0.00',
            'remark'        => '平台佣金',
        ]);
    }

    // ---------- 配置读写 ----------

    public function testSetThenGet(): void
    {
        $svc = new SettingService();
        $this->assertNull($svc->get('site_name'));
        $this->assertSame('def', $svc->get('site_name', 'def'));

        $svc->set('site_name', '发卡平台');
        $this->assertSame('发卡平台', $svc->get('site_name'));

        // upsert:再次 set 为更新而非新增
        $svc->set('site_name', '新名称');
        $this->assertSame('新名称', $svc->get('site_name'));
        $this->assertSame(1, \app\model\SystemSetting::where('setting_key', 'site_name')->count());
    }

    public function testAllReturnsKeyValueMap(): void
    {
        $svc = new SettingService();
        $svc->set('a', '1');
        $svc->set('b', '2');
        $all = $svc->all();
        $this->assertSame('1', $all['a']);
        $this->assertSame('2', $all['b']);
    }

    public function testSettingsEndpoints(): void
    {
        // POST upsert
        $r = $this->callJson('POST', '/admin/settings', ['key' => 'theme', 'value' => 'dark'], $this->hdr());
        $this->assertSame(0, $r['code']);

        // GET all
        $r = $this->callJson('GET', '/admin/settings', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame('dark', $r['data']['items']['theme']);
    }

    /** 安全:smtp_pass 敏感键不得明文下发,且留空保存=不修改(防泄漏/防误清) */
    public function testSmtpPassMaskedAndKeptOnEmpty(): void
    {
        $this->callJson('POST', '/admin/settings', ['key' => 'smtp_pass', 'value' => 'topsecret'], $this->hdr());

        // GET 脱敏:不回传明文,只给 *_set 标志
        $items = $this->callJson('GET', '/admin/settings', [], $this->hdr())['data']['items'];
        $this->assertArrayNotHasKey('smtp_pass', $items, 'smtp_pass 明文不得下发');
        $this->assertTrue($items['smtp_pass_set'], '应给出已配置标志 smtp_pass_set');

        $svc = new \app\service\SettingService();
        // 留空保存 = 不修改(沿用原密钥)
        $this->callJson('POST', '/admin/settings', ['key' => 'smtp_pass', 'value' => ''], $this->hdr());
        $this->assertSame('topsecret', $svc->get('smtp_pass'), '留空保存不得清空已配置密钥');
        // 传新值 = 更新
        $this->callJson('POST', '/admin/settings', ['key' => 'smtp_pass', 'value' => 'newsecret'], $this->hdr());
        $this->assertSame('newsecret', $svc->get('smtp_pass'));
    }

    public function testSettingsRequireAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/settings')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/settings', ['key' => 'x', 'value' => 'y'])->getCode());
    }

    // ---------- 对账报表 ----------

    public function testSettlementReportAmounts(): void
    {
        $m1 = $this->makeMerchant();
        $m2 = $this->makeMerchant();
        $p1 = Product::create(['merchant_id' => $m1->id, 'title' => 'c', 'price' => '5.00']);
        $p2 = Product::create(['merchant_id' => $m2->id, 'title' => 'c', 'price' => '5.00']);

        // m1: 已支付 100 + 已发货 50 = 销售 150;关闭 999 不计;佣金 -10 + -5 = 15
        $this->order((int) $m1->id, (int) $p1->id, Order::STATUS_PAID, '100.00');
        $this->order((int) $m1->id, (int) $p1->id, Order::STATUS_DELIVERED, '50.00');
        $this->order((int) $m1->id, (int) $p1->id, Order::STATUS_CLOSED, '999.00');
        $this->commissionLog((int) $m1->id, '-10.00');
        $this->commissionLog((int) $m1->id, '-5.00');

        // m2: 已支付 30 = 销售 30;佣金 -3
        $this->order((int) $m2->id, (int) $p2->id, Order::STATUS_PAID, '30.00');
        $this->commissionLog((int) $m2->id, '-3.00');

        $rep = (new AdminReportService())->settlementReport();

        $by = [];
        foreach ($rep['items'] as $row) {
            $by[$row['merchant_id']] = $row;
        }

        $this->assertSame('150.00', $by[(int) $m1->id]['sales']);
        $this->assertSame('15.00', $by[(int) $m1->id]['commission']);
        $this->assertSame('30.00', $by[(int) $m2->id]['sales']);
        $this->assertSame('3.00', $by[(int) $m2->id]['commission']);

        $this->assertSame('180.00', $rep['total']['sales']);
        $this->assertSame('18.00', $rep['total']['commission']);
    }

    public function testSettlementReportRespectsHalfOpenRange(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '5.00']);

        $o = $this->order((int) $m->id, (int) $p->id, Order::STATUS_PAID, '40.00');
        // 强制订单 create_time 为固定时刻
        Order::where('id', $o->id)->update(['create_time' => '2026-06-10 12:00:00']);

        // 区间 [2026-06-01, 2026-06-11) 命中
        $in = (new AdminReportService())->settlementReport('2026-06-01 00:00:00', '2026-06-11 00:00:00');
        $this->assertSame('40.00', $in['total']['sales']);

        // 区间 [2026-06-11, 2026-06-20) 不命中(半开,end 排他)
        $out = (new AdminReportService())->settlementReport('2026-06-11 00:00:00', '2026-06-20 00:00:00');
        $this->assertSame('0.00', $out['total']['sales']);
        $this->assertSame([], $out['items']);
    }

    public function testSettlementReportEndpoint(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '5.00']);
        $this->order((int) $m->id, (int) $p->id, Order::STATUS_PAID, '20.00');
        $this->commissionLog((int) $m->id, '-2.00');

        $r = $this->callJson('GET', '/admin/reports/settlement', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame('20.00', $r['data']['total']['sales']);
        $this->assertSame('2.00', $r['data']['total']['commission']);
    }

    public function testReportRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/reports/settlement')->getCode());
    }
}
