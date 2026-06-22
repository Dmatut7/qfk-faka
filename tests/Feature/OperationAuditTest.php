<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\SystemLog;
use tests\TestCase;

/**
 * 平台操作审计(admin-12):敏感后台操作写入 type=admin_op 的操作日志,含 action + actor_id。
 */
class OperationAuditTest extends TestCase
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

    private function opLog(string $action): ?SystemLog
    {
        foreach (SystemLog::where('type', 'admin_op')->order('id', 'desc')->select() as $log) {
            $ctx = $log->context;
            if (is_array($ctx) && ($ctx['action'] ?? '') === $action) {
                return $log;
            }
        }
        return null;
    }

    public function testBlacklistAddIsAudited(): void
    {
        $this->callJson('POST', '/admin/blacklist', ['email' => 'aud@x.com', 'reason' => '刷单'], $this->hdr());
        $log = $this->opLog('blacklist_add');
        $this->assertNotNull($log);
        $this->assertSame('aud@x.com', $log->context['email']);
        $this->assertGreaterThan(0, (int) $log->context['actor_id']);
    }

    public function testMerchantFreezeIsAudited(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $this->callJson('POST', '/admin/merchants/' . $m->id . '/freeze', [], $this->hdr());
        $log = $this->opLog('merchant_freeze');
        $this->assertNotNull($log);
        $this->assertSame((int) $m->id, (int) $log->context['merchant_id']);
    }

    public function testOperationLogsListedViaLogsEndpoint(): void
    {
        $this->callJson('POST', '/admin/blacklist', ['email' => 'list@x.com'], $this->hdr());
        $r = $this->callJson('GET', '/admin/logs', ['type' => 'admin_op'], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertGreaterThanOrEqual(1, $r['data']['total']);
        $this->assertSame('admin_op', $r['data']['items'][0]['type']);
    }
}
