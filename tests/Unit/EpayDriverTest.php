<?php
declare(strict_types=1);

namespace tests\Unit;

use app\service\pay\EpayDriver;
use app\service\pay\PayDriverInterface;
use PHPUnit\Framework\TestCase;

/**
 * 易支付 MD5 驱动:验签 (T6.2, TDD)。
 *
 * 验签算法(彩虹易支付):剔除 sign/sign_type 与空值 → 键名 ASCII 升序 →
 * 拼成 k=v&k=v(不 urlencode)→ 末尾接商户 key → md5 取小写。
 */
class EpayDriverTest extends TestCase
{
    private EpayDriver $driver;
    private array $config = ['pid' => '1001', 'key' => 'testkey123', 'gateway' => 'https://pay.example.com'];

    protected function setUp(): void
    {
        $this->driver = new EpayDriver();
    }

    /** 按规范独立计算期望签名,用于钉死算法(字段选取/排序/格式) */
    private function expectedSign(array $params, string $key): string
    {
        unset($params['sign'], $params['sign_type']);
        $params = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($params);
        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        return md5(implode('&', $parts) . $key);
    }

    public function testIsDriver(): void
    {
        $this->assertInstanceOf(PayDriverInterface::class, $this->driver);
    }

    public function testValidSignatureVerifies(): void
    {
        $params = ['pid' => '1001', 'type' => 'alipay', 'out_trade_no' => 'ORD1', 'name' => '商品', 'money' => '9.99', 'trade_no' => 'TR1', 'trade_status' => 'TRADE_SUCCESS'];
        $params['sign'] = $this->expectedSign($params, $this->config['key']);
        $params['sign_type'] = 'MD5';

        $this->assertTrue($this->driver->verify($params, $this->config));
    }

    public function testTamperedAmountFailsVerify(): void
    {
        $params = ['pid' => '1001', 'out_trade_no' => 'ORD1', 'money' => '9.99', 'trade_no' => 'TR1', 'trade_status' => 'TRADE_SUCCESS'];
        $params['sign'] = $this->expectedSign($params, $this->config['key']);

        // 攻击者改金额但不会重算签名
        $params['money'] = '0.01';
        $this->assertFalse($this->driver->verify($params, $this->config), '篡改任一参数后验签必须失败');
    }

    public function testMissingSignFailsVerify(): void
    {
        $params = ['pid' => '1001', 'out_trade_no' => 'ORD1', 'money' => '9.99'];
        $this->assertFalse($this->driver->verify($params, $this->config), '缺签名一律拒绝');
        $params['sign'] = '';
        $this->assertFalse($this->driver->verify($params, $this->config), '空签名一律拒绝');
    }

    public function testWrongKeyFailsVerify(): void
    {
        $params = ['pid' => '1001', 'out_trade_no' => 'ORD1', 'money' => '9.99', 'trade_status' => 'TRADE_SUCCESS'];
        $params['sign'] = $this->expectedSign($params, 'attacker_key');
        $this->assertFalse($this->driver->verify($params, $this->config), '用错误密钥签的名必须被拒');
    }

    public function testBuildPayRoundTripsThroughVerify(): void
    {
        $built = $this->driver->buildPay([
            'out_trade_no' => 'ORD9', 'amount' => '12.50', 'subject' => '测试商品',
            'notify_url' => 'https://shop/notify', 'return_url' => 'https://shop/return', 'type' => 'alipay',
        ], $this->config);

        $this->assertArrayHasKey('url', $built);
        $this->assertArrayHasKey('params', $built);
        $this->assertSame('MD5', $built['params']['sign_type']);
        // 自己签的名必须能自洽验签
        $this->assertTrue($this->driver->verify($built['params'], $this->config));
    }

    public function testParseExtractsFields(): void
    {
        $parsed = $this->driver->parse(['out_trade_no' => 'ORD1', 'trade_no' => 'CH123', 'money' => '9.99', 'trade_status' => 'TRADE_SUCCESS']);
        $this->assertSame('ORD1', $parsed['out_trade_no']);
        $this->assertSame('CH123', $parsed['channel_trade_no']);
        $this->assertSame('9.99', $parsed['amount']);
        $this->assertTrue($parsed['success']);
    }

    public function testParseNonSuccessStatus(): void
    {
        $parsed = $this->driver->parse(['out_trade_no' => 'ORD1', 'trade_no' => 'CH123', 'money' => '9.99', 'trade_status' => 'WAIT_BUYER_PAY']);
        $this->assertFalse($parsed['success']);
    }

    public function testSuccessResponseIsSuccess(): void
    {
        $this->assertSame('success', $this->driver->successResponse());
    }
}
