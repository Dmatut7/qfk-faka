<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Product;
use app\service\LowStockAlertService;
use app\service\SettingService;
use tests\Support\RecordingMailer;
use tests\Support\ThrowingMailer;
use tests\TestCase;

/**
 * 库存预警(LowStockAlertService):跌破阈值发信 + 去重 + 回升清零 + 关闭门控 + 失败可重试。
 */
class LowStockAlertTest extends TestCase
{
    protected function tearDown(): void
    {
        LowStockAlertService::setTestMailer(null);
        parent::tearDown();
    }

    /** 造一个在售自动发卡商品(默认带商户邮箱),返回 [merchant, product]。 */
    private function product(int $stock, array $override = []): array
    {
        $m = $this->makeMerchant(['email' => 'm' . uniqid() . '@example.com']);
        $p = Product::create(array_merge([
            'merchant_id'        => $m->id,
            'title'              => '低库存商品',
            'price'              => '10.00',
            'status'             => Product::STATUS_ON,
            'type'               => Product::TYPE_AUTO,
            'stock'              => $stock,
            'low_stock_notified' => 0,
        ], $override));
        return [$m, $p];
    }

    public function testAlertsMerchantWhenStockBelowThreshold(): void
    {
        (new SettingService())->set('low_stock_threshold', '5');
        [$m, $p] = $this->product(3);
        $rec = new RecordingMailer();
        LowStockAlertService::setTestMailer($rec);

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(1, $sent);
        $this->assertCount(1, $rec->sent);
        $this->assertSame($m->email, $rec->last()['to'], '应发给商户邮箱');
        $this->assertStringContainsString('库存预警', $rec->last()['subject']);
        $this->assertStringContainsString('低库存商品', $rec->last()['subject']);
        $this->assertSame(1, (int) Product::find($p->id)->low_stock_notified, '发信成功应置位防重复');
    }

    public function testDedupDoesNotReAlertWhenAlreadyNotified(): void
    {
        (new SettingService())->set('low_stock_threshold', '5');
        $this->product(3, ['low_stock_notified' => 1]);
        $rec = new RecordingMailer();
        LowStockAlertService::setTestMailer($rec);

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(0, $sent, '已通知过的商品不应再次预警');
        $this->assertCount(0, $rec->sent);
    }

    public function testReArmsWhenRestockedAboveThreshold(): void
    {
        (new SettingService())->set('low_stock_threshold', '5');
        [, $p] = $this->product(20, ['low_stock_notified' => 1]); // 已回升但仍标记已通知
        $rec = new RecordingMailer();
        LowStockAlertService::setTestMailer($rec);

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(0, $sent);
        $this->assertSame(0, (int) Product::find($p->id)->low_stock_notified, '回升超过阈值应清零再武装');
    }

    public function testDisabledWhenThresholdZero(): void
    {
        (new SettingService())->set('low_stock_threshold', '0');
        $this->product(0);
        $rec = new RecordingMailer();
        LowStockAlertService::setTestMailer($rec);

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(0, $sent, '阈值≤0 整体关闭');
        $this->assertCount(0, $rec->sent);
    }

    public function testIgnoresManualAndOfflineProducts(): void
    {
        (new SettingService())->set('low_stock_threshold', '5');
        $this->product(0, ['type' => Product::TYPE_MANUAL]);  // 手动发货无卡池,stock 恒 0,不应纳入
        $this->product(0, ['status' => Product::STATUS_OFF]); // 下架不应纳入
        $rec = new RecordingMailer();
        LowStockAlertService::setTestMailer($rec);

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(0, $sent);
        $this->assertCount(0, $rec->sent);
    }

    public function testRetriesNextRunWhenSendFails(): void
    {
        (new SettingService())->set('low_stock_threshold', '5');
        [, $p] = $this->product(2);
        LowStockAlertService::setTestMailer(new ThrowingMailer());

        $sent = (new LowStockAlertService())->run();

        $this->assertSame(0, $sent, '发信失败不计入');
        $this->assertSame(0, (int) Product::find($p->id)->low_stock_notified, '发信失败必须保留未通知态以便下轮重试');
    }
}
