<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\model\Product;
use app\model\SystemLog;
use app\service\BuyerBlacklistService;
use app\service\OrderService;
use tests\TestCase;

/**
 * 风控记录:黑名单买家下单被拦截 → 写风控事件;管理端可聚合查询。
 */
class RiskRecordTest extends TestCase
{
    public function testBlacklistBlockCreatesRiskRecord(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '5.00', 'status' => Product::STATUS_ON]);
        (new BuyerBlacklistService())->add('risk@x.com');

        try {
            (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'risk@x.com']);
            $this->fail('应被拦截');
        } catch (BizException $e) {
            // 拦截即可
        }

        $log = SystemLog::where('type', 'risk_event')->order('id', 'desc')->find();
        $this->assertNotNull($log);
        $this->assertSame('blacklist_block', $log->context['risk']);
        $this->assertSame('risk@x.com', $log->context['email']);
    }

    public function testRiskEndpointAggregates(): void
    {
        $token = $this->bearer($this->makeAdminToken());
        // 造一条风控事件
        (new \app\service\SystemLogService())->risk('blacklist_block', '测试拦截', ['email' => 'a@x.com']);

        $r = $this->callJson('GET', '/admin/risk-records', [], $token);
        $this->assertSame(0, $r['code']);
        $this->assertGreaterThanOrEqual(1, $r['data']['total']);
    }

    public function testRiskEndpointRequiresAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/risk-records')->getCode());
    }
}
