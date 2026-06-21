<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use tests\TestCase;

/**
 * 全局中间件:CORS + 限流 (T9.1)。
 */
class MiddlewareTest extends TestCase
{
    protected bool $useTransaction = false;

    public function testCorsHeaderPresent(): void
    {
        $resp = $this->call('GET', '/health');
        $this->assertNotEmpty($resp->getHeader('Access-Control-Allow-Origin'));
        $this->assertStringContainsString('POST', (string) $resp->getHeader('Access-Control-Allow-Methods'));
    }

    public function testOptionsPreflightReturns204(): void
    {
        $resp = $this->call('OPTIONS', '/buyer/order');
        $this->assertSame(204, $resp->getCode());
    }

    public function testRateLimitReturns429AfterThreshold(): void
    {
        // 下单限流 30 次/分;第 31 次应被限流
        for ($i = 0; $i < 30; $i++) {
            $resp = $this->call('POST', '/buyer/order', ['product_id' => 999999, 'quantity' => 1, 'buyer_email' => 'a@b.com']);
            $this->assertNotSame(429, $resp->getCode(), "第 $i 次不应被限流");
        }
        $resp = $this->call('POST', '/buyer/order', ['product_id' => 999999, 'quantity' => 1, 'buyer_email' => 'a@b.com']);
        $this->assertSame(429, $resp->getCode());
        $this->assertSame(Code::RATE_LIMITED, json_decode($resp->getContent(), true)['code']);
    }
}
