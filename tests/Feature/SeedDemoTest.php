<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Admin;
use app\model\Card;
use app\model\Merchant;
use app\model\PaymentChannel;
use app\model\Product;
use tests\TestCase;
use think\facade\Console;

/**
 * db:seed 种子命令测试:重点验证幂等性(可重复执行不报错、不重复插入)。
 */
class SeedDemoTest extends TestCase
{
    public function testSeedCreatesDemoData(): void
    {
        Console::call('db:seed');

        // 管理员存在
        $admin = Admin::where('username', 'admin')->find();
        $this->assertNotNull($admin);
        $this->assertSame(Admin::STATUS_ENABLED, (int) $admin->status);
        $this->assertTrue(password_verify('admin123', $admin->password));

        // epay 渠道存在且启用
        $channel = PaymentChannel::where('code', 'epay')->find();
        $this->assertNotNull($channel);
        // driver 应与注册键一致(PayManager::DRIVERS['epay']),不再是内部类名
        $this->assertSame('epay', $channel->driver);
        $this->assertSame(PaymentChannel::STATUS_ENABLED, (int) $channel->status);
        $this->assertTrue($channel->isEnabled());
        $this->assertIsArray($channel->config);
        $this->assertArrayHasKey('pid', $channel->config);
        $this->assertArrayHasKey('key', $channel->config);
        $this->assertArrayHasKey('gateway', $channel->config);

        // 演示商户(active)+ 商品 + 卡密
        $merchant = Merchant::where('username', 'demo_merchant')->find();
        $this->assertNotNull($merchant);
        $this->assertTrue($merchant->isActive());

        $product = Product::where('merchant_id', $merchant->id)->where('sku', 'DEMO-SKU')->find();
        $this->assertNotNull($product);

        $cardCount = Card::where('product_id', $product->id)->count();
        $this->assertSame(5, $cardCount);
        // stock 与未售卡真值一致
        $this->assertSame(5, (int) $product->stock);
    }

    public function testSeedIsIdempotent(): void
    {
        // 连续两次执行不应报错
        Console::call('db:seed');
        Console::call('db:seed');

        // 管理员仍只有一份
        $this->assertSame(1, Admin::where('username', 'admin')->count());

        // epay 渠道仍只有一份且启用
        $this->assertSame(1, PaymentChannel::where('code', 'epay')->count());
        $channel = PaymentChannel::where('code', 'epay')->find();
        $this->assertSame(PaymentChannel::STATUS_ENABLED, (int) $channel->status);

        // 商户 / 商品 / 卡密均不重复
        $this->assertSame(1, Merchant::where('username', 'demo_merchant')->count());

        $merchant = Merchant::where('username', 'demo_merchant')->find();
        $product = Product::where('merchant_id', $merchant->id)->where('sku', 'DEMO-SKU')->find();
        $this->assertSame(1, Product::where('merchant_id', $merchant->id)->where('sku', 'DEMO-SKU')->count());

        // 卡密不因重复执行而翻倍,stock 不漂移
        $this->assertSame(5, Card::where('product_id', $product->id)->count());
        $this->assertSame(5, (int) $product->stock);
    }
}
