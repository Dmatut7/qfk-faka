<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\PaymentChannel;
use app\service\pay\EpayDriver;
use app\service\pay\PayManager;
use tests\TestCase;

/**
 * 支付渠道管理 (T6.1)。
 */
class PayManagerTest extends TestCase
{
    private PayManager $mgr;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mgr = new PayManager();
    }

    private function channel(string $code, int $status = PaymentChannel::STATUS_ENABLED): PaymentChannel
    {
        return PaymentChannel::create([
            'code' => $code, 'name' => '渠道', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => 'k', 'gateway' => 'https://pay'],
            'status' => $status,
        ]);
    }

    public function testDriverResolves(): void
    {
        $this->assertInstanceOf(EpayDriver::class, $this->mgr->driver('epay'));
    }

    public function testUnknownDriverThrows(): void
    {
        try {
            $this->mgr->driver('alipay'); // 本期未实现
            $this->fail('应抛渠道不可用');
        } catch (BizException $e) {
            $this->assertSame(Code::CHANNEL_UNAVAILABLE, $e->getBizCode());
        }
    }

    public function testEnabledChannelForPay(): void
    {
        $this->channel('epay_' . uniqid());
        $code = PaymentChannel::order('id', 'desc')->value('code');
        $this->assertTrue($this->mgr->enabledChannel($code)->isEnabled());
    }

    public function testDisabledChannelRejectedForPay(): void
    {
        $ch = $this->channel('epay_' . uniqid(), PaymentChannel::STATUS_DISABLED);
        try {
            $this->mgr->enabledChannel($ch->code);
            $this->fail('停用渠道发起支付应被拒');
        } catch (BizException $e) {
            $this->assertSame(Code::CHANNEL_UNAVAILABLE, $e->getBizCode());
        }
    }

    public function testMissingChannelRejectedForPay(): void
    {
        $this->expectException(BizException::class);
        $this->mgr->enabledChannel('no_such_channel');
    }

    public function testChannelForNotifyReturnsEvenWhenDisabled(): void
    {
        $ch = $this->channel('epay_' . uniqid(), PaymentChannel::STATUS_DISABLED);
        // 回调侧:停用渠道仍可取到(在途回调要处理)
        $this->assertNotNull($this->mgr->channel($ch->code));
        $this->assertNull($this->mgr->channel('no_such_channel'));
    }
}
