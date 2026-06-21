<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\AccessToken;
use app\service\TokenService;
use tests\TestCase;

/**
 * Token 服务 (T3.1, TDD):签发(存哈希+过期)、校验、撤销。
 */
class TokenServiceTest extends TestCase
{
    private TokenService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new TokenService();
    }

    public function testIssueStoresHashNotPlaintext(): void
    {
        $token = $this->svc->issue(AccessToken::OWNER_ADMIN, 7);

        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $token);

        // 库里存的是哈希,不是明文
        $row = AccessToken::where('token_hash', hash('sha256', $token))->find();
        $this->assertNotNull($row);
        $this->assertSame(AccessToken::OWNER_ADMIN, $row->owner_type);
        $this->assertSame(7, $row->owner_id);
        $this->assertNull(AccessToken::where('token_hash', $token)->find(), '明文不应出现在库中');
        $this->assertGreaterThan(time(), strtotime($row->expires_at));
    }

    public function testVerifyValidToken(): void
    {
        $token = $this->svc->issue(AccessToken::OWNER_MERCHANT, 42);
        $info = $this->svc->verify($token);

        $this->assertIsArray($info);
        $this->assertSame(AccessToken::OWNER_MERCHANT, $info['owner_type']);
        $this->assertSame(42, $info['owner_id']);
    }

    public function testVerifyRejectsUnknownToken(): void
    {
        $this->assertNull($this->svc->verify(str_repeat('a', 64)));
    }

    public function testVerifyRejectsExpiredToken(): void
    {
        $token = $this->svc->issue(AccessToken::OWNER_ADMIN, 1, 3600);
        // 手动把过期时间改到过去
        AccessToken::where('token_hash', hash('sha256', $token))
            ->update(['expires_at' => date('Y-m-d H:i:s', time() - 10)]);

        $this->assertNull($this->svc->verify($token), '过期 token 应失效');
    }

    public function testRevoke(): void
    {
        $token = $this->svc->issue(AccessToken::OWNER_BUYER, 5);
        $this->assertIsArray($this->svc->verify($token));

        $this->svc->revoke($token);
        $this->assertNull($this->svc->verify($token), '撤销后失效');
    }

    public function testRevokeAllFor(): void
    {
        $t1 = $this->svc->issue(AccessToken::OWNER_MERCHANT, 100);
        $t2 = $this->svc->issue(AccessToken::OWNER_MERCHANT, 100);
        $other = $this->svc->issue(AccessToken::OWNER_MERCHANT, 200);

        $this->svc->revokeAllFor(AccessToken::OWNER_MERCHANT, 100);

        $this->assertNull($this->svc->verify($t1));
        $this->assertNull($this->svc->verify($t2));
        $this->assertIsArray($this->svc->verify($other), '不应影响其他主体');
    }
}
