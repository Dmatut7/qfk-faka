<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\PaymentChannel;
use tests\TestCase;

/**
 * 平台支付渠道管理:CRUD / 唯一 code / 空 key 拒绝 / 启停 / 验签自测 (T8.2)。
 */
class AdminChannelTest extends TestCase
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

    private function makeChannel(array $override = []): PaymentChannel
    {
        $u = uniqid();
        return PaymentChannel::create(array_merge([
            'code'   => 'ch_' . $u,
            'name'   => '测试渠道',
            'driver' => 'epay',
            'config' => ['pid' => '1000', 'key' => 'secretkey', 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
            'sort'   => 0,
        ], $override));
    }

    public function testCreateChannel(): void
    {
        $r = $this->callJson('POST', '/admin/channels', [
            'code'   => 'epay_test1',
            'name'   => '易支付A',
            'driver' => 'epay',
            'config' => ['pid' => '1001', 'key' => 'abc123', 'gateway' => 'https://g.example.com'],
            'sort'   => 5,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $this->assertSame('epay_test1', $r['data']['code']);
        $ch = PaymentChannel::where('code', 'epay_test1')->find();
        $this->assertNotNull($ch);
        $this->assertSame(PaymentChannel::STATUS_ENABLED, (int) $ch->status);
        $this->assertSame('abc123', $ch->config['key']);
        $this->assertSame(5, (int) $ch->sort);
    }

    public function testCreateDuplicateCodeRejected(): void
    {
        $this->makeChannel(['code' => 'dup_code']);
        $r = $this->callJson('POST', '/admin/channels', [
            'code'   => 'dup_code',
            'name'   => '重复',
            'driver' => 'epay',
            'config' => ['key' => 'k'],
        ], $this->hdr());
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testCreateEmptyKeyRejected(): void
    {
        $r = $this->callJson('POST', '/admin/channels', [
            'code'   => 'nokey1',
            'name'   => '无密钥',
            'driver' => 'epay',
            'config' => ['pid' => '1001', 'key' => ''],
        ], $this->hdr());
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        $this->assertNull(PaymentChannel::where('code', 'nokey1')->find());
    }

    public function testCreateMissingKeyRejected(): void
    {
        $r = $this->callJson('POST', '/admin/channels', [
            'code'   => 'nokey2',
            'name'   => '缺密钥',
            'driver' => 'epay',
            'config' => ['pid' => '1001'],
        ], $this->hdr());
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }

    public function testList(): void
    {
        $this->makeChannel(['code' => 'list_a', 'sort' => 2]);
        $this->makeChannel(['code' => 'list_b', 'sort' => 1]);
        $r = $this->callJson('GET', '/admin/channels', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertGreaterThanOrEqual(2, count($r['data']['items']));
    }

    public function testUpdateChannel(): void
    {
        $ch = $this->makeChannel();
        $r  = $this->callJson('POST', '/admin/channels/' . $ch->id, [
            'name'   => '改后名',
            'driver' => 'epay',
            'config' => ['pid' => '2000', 'key' => 'newkey'],
            'sort'   => 9,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $fresh = PaymentChannel::find($ch->id);
        $this->assertSame('改后名', $fresh->name);
        $this->assertSame('newkey', $fresh->config['key']);
        $this->assertSame(9, (int) $fresh->sort);
    }

    public function testUpdateEmptyKeyRejected(): void
    {
        $ch = $this->makeChannel();
        $r  = $this->callJson('POST', '/admin/channels/' . $ch->id, [
            'config' => ['key' => ''],
        ], $this->hdr());
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        // 原 config 不被破坏
        $this->assertSame('secretkey', PaymentChannel::find($ch->id)->config['key']);
    }

    public function testSetStatusDisableEnable(): void
    {
        $ch = $this->makeChannel();
        $r1 = $this->callJson('POST', '/admin/channels/' . $ch->id . '/status', ['enable' => 0], $this->hdr());
        $this->assertSame(0, $r1['code']);
        $this->assertSame(PaymentChannel::STATUS_DISABLED, (int) PaymentChannel::find($ch->id)->status);

        $r2 = $this->callJson('POST', '/admin/channels/' . $ch->id . '/status', ['enable' => 1], $this->hdr());
        $this->assertSame(0, $r2['code']);
        $this->assertSame(PaymentChannel::STATUS_ENABLED, (int) PaymentChannel::find($ch->id)->status);
    }

    public function testTestSignValid(): void
    {
        $key    = 'mysecret';
        $ch     = $this->makeChannel(['code' => 'sign_ok', 'config' => ['pid' => '1', 'key' => $key]]);
        $params = ['pid' => '1', 'out_trade_no' => 'ABC123', 'money' => '9.99', 'trade_status' => 'TRADE_SUCCESS'];
        // 复刻驱动签名算法,算出合法签名
        $signed = $this->signEpay($params, $key);

        $r = $this->callJson('POST', '/admin/channels/' . $ch->id . '/test-sign', [
            'code'          => 'sign_ok',
            'sample_params' => $signed,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $this->assertTrue($r['data']['valid']);
    }

    public function testTestSignInvalid(): void
    {
        $ch = $this->makeChannel(['code' => 'sign_bad', 'config' => ['pid' => '1', 'key' => 'mysecret']]);
        $r  = $this->callJson('POST', '/admin/channels/' . $ch->id . '/test-sign', [
            'code'          => 'sign_bad',
            'sample_params' => ['pid' => '1', 'out_trade_no' => 'ABC123', 'money' => '9.99', 'sign' => 'deadbeef'],
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $this->assertFalse($r['data']['valid']);
    }

    public function testTestSignUsesPathIdNotBodyCode(): void
    {
        // 路径 id 指向「正确密钥」渠道;body code 故意指向另一条「错误密钥」渠道。
        // 验签结果应由 URL 路径 id 决定 → 用正确密钥签名应判定 valid。
        $rightKey = 'rightsecret';
        $right = $this->makeChannel(['code' => 'sign_right', 'config' => ['pid' => '1', 'key' => $rightKey]]);
        $this->makeChannel(['code' => 'sign_wrong', 'config' => ['pid' => '1', 'key' => 'wrongsecret']]);

        $params = ['pid' => '1', 'out_trade_no' => 'PATHWINS', 'money' => '1.00', 'trade_status' => 'TRADE_SUCCESS'];
        $signed = $this->signEpay($params, $rightKey); // 用「正确密钥」签名

        $r = $this->callJson('POST', '/admin/channels/' . $right->id . '/test-sign', [
            'code'          => 'sign_wrong', // body 兜底字段故意错位,应被忽略
            'sample_params' => $signed,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        // 若错误地用 body 的 sign_wrong(wrongsecret)验签会失败;路径 id 生效则为 true
        $this->assertTrue($r['data']['valid']);
    }

    public function testRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/channels')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/channels', [
            'code' => 'x', 'name' => 'y', 'driver' => 'epay', 'config' => ['key' => 'k'],
        ])->getCode());
    }

    /** 复刻 EpayDriver 的签名算法,生成合法 sign 用于验签自测。 */
    private function signEpay(array $params, string $key): array
    {
        unset($params['sign'], $params['sign_type']);
        $filtered = array_filter($params, static fn($v) => is_scalar($v) && $v !== '');
        ksort($filtered);
        $parts = [];
        foreach ($filtered as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        $params['sign'] = md5(implode('&', $parts) . $key);
        return $params;
    }
}
