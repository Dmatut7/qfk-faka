<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Merchant;

/**
 * 商户开放 API:凭据生成 + 签名校验(供商户系统程序化拉取自有商品/订单)。
 *
 * 签名:剔除 sign、按键名 ASCII 升序拼 k=v&k=v,HMAC-SHA256(明文, api_secret) 取小写 hex。
 * 防重放:请求须带 timestamp(秒),与服务端时间偏差超 ±300s 拒绝。
 */
class MerchantApiService
{
    /** 时间戳容差(秒),防重放 */
    public const TS_TOLERANCE = 300;

    /** 生成/重置商户 API 凭据,返回明文(api_secret 仅此一次可见)。 */
    public function generateCredentials(int $merchantId): array
    {
        $m = Merchant::find($merchantId);
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        $apiKey    = 'mk_' . bin2hex(random_bytes(12));
        $apiSecret = bin2hex(random_bytes(24));
        $m->api_key    = $apiKey;
        $m->api_secret = $apiSecret;
        $m->save();

        return ['api_key' => $apiKey, 'api_secret' => $apiSecret];
    }

    /**
     * 校验签名请求,返回对应商户。失败抛 BizException。
     *
     * @param array $params 全部请求参数(含 app_key/timestamp/sign)
     */
    public function authenticate(array $params): Merchant
    {
        $apiKey = (string) ($params['app_key'] ?? '');
        $sign   = (string) ($params['sign'] ?? '');
        $ts     = (int) ($params['timestamp'] ?? 0);
        if ($apiKey === '' || $sign === '') {
            throw new BizException(Code::PARAM_ERROR, '缺少 app_key 或 sign');
        }
        if ($ts <= 0 || abs(time() - $ts) > self::TS_TOLERANCE) {
            throw new BizException(Code::PARAM_ERROR, '请求已过期(timestamp 偏差过大)');
        }

        $m = Merchant::where('api_key', $apiKey)->find();
        if (!$m) {
            throw new BizException(Code::UNAUTHORIZED, 'app_key 无效');
        }
        if ((int) $m->status !== Merchant::STATUS_ACTIVE) {
            throw new BizException(Code::FORBIDDEN, '商户状态不可用');
        }
        // 时序安全比对(api_secret 经模型 $hidden 不外泄,这里用原始属性)
        $calc = $this->sign($params, (string) $m->getData('api_secret'));
        if (!hash_equals($calc, $sign)) {
            throw new BizException(Code::SIGN_INVALID, '签名校验失败');
        }
        return $m;
    }

    /** 计算签名:剔除 sign/sign_type 与空值 → 键名升序 → k=v&k=v → HMAC-SHA256(secret)。 */
    public function sign(array $params, string $secret): string
    {
        unset($params['sign'], $params['sign_type']);
        $params = array_filter($params, static fn ($v) => is_scalar($v) && $v !== '');
        ksort($params);
        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        return hash_hmac('sha256', implode('&', $parts), $secret);
    }
}
