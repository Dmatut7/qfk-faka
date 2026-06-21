<?php
declare(strict_types=1);

namespace tests\Feature;

use tests\TestCase;

/**
 * 健康检查接口集成测试。
 */
class HealthTest extends TestCase
{
    // 只读探活,无需事务包裹
    protected bool $useTransaction = false;

    public function testHealthEndpointReturnsOkAndDatabaseReachable(): void
    {
        $response = $this->call('GET', '/health');
        $this->assertSame(200, $response->getCode());

        $body = json_decode($response->getContent(), true);
        $this->assertIsArray($body);
        $this->assertSame(0, $body['code']);
        $this->assertSame('ok', $body['data']['status']);
        $this->assertSame('qfk-faka', $body['data']['service']);
        $this->assertSame('ok', $body['data']['database'], '健康检查应能连通测试数据库');
    }
}
