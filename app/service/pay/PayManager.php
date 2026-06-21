<?php
declare(strict_types=1);

namespace app\service\pay;

use app\common\BizException;
use app\common\Code;
use app\model\PaymentChannel;

/**
 * 支付渠道管理:按 code 解析渠道配置与驱动实例。
 *
 * 区分两类取用:
 * - enabledChannel():发起支付用,渠道必须存在且启用(否则 5002);
 * - channel():回调用,在途回调即使渠道已停用也要正常处理(spec §10.4.6),只要渠道存在。
 */
class PayManager
{
    /** code → 驱动类。支付宝/微信本期仅预留接口,未注册驱动。 */
    private const DRIVERS = [
        'epay' => EpayDriver::class,
    ];

    public function enabledChannel(string $code): PaymentChannel
    {
        $ch = PaymentChannel::where('code', $code)->find();
        if (!$ch || !$ch->isEnabled()) {
            throw new BizException(Code::CHANNEL_UNAVAILABLE, '支付渠道不可用');
        }
        return $ch;
    }

    public function channel(string $code): ?PaymentChannel
    {
        return PaymentChannel::where('code', $code)->find();
    }

    public function driver(string $code): PayDriverInterface
    {
        if (!isset(self::DRIVERS[$code])) {
            throw new BizException(Code::CHANNEL_UNAVAILABLE, '未支持的支付渠道驱动:' . $code);
        }
        $class = self::DRIVERS[$code];
        return new $class();
    }

    public function supports(string $code): bool
    {
        return isset(self::DRIVERS[$code]);
    }
}
