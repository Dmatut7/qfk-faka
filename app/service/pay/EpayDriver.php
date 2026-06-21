<?php
declare(strict_types=1);

namespace app\service\pay;

/**
 * 易支付(彩虹版)MD5 驱动。
 *
 * 签名算法:剔除 sign / sign_type 与空值 → 键名 ASCII 升序 →
 * 拼成 k=v&k=v(不 urlencode)→ 末尾接商户 key → md5 取小写。
 */
class EpayDriver implements PayDriverInterface
{
    public function buildPay(array $order, array $config): array
    {
        $params = [
            'pid'          => (string) ($config['pid'] ?? ''),
            'type'         => (string) ($order['type'] ?? 'alipay'),
            'out_trade_no' => (string) $order['out_trade_no'],
            'notify_url'   => (string) $order['notify_url'],
            'return_url'   => (string) ($order['return_url'] ?? ''),
            'name'         => (string) $order['subject'],
            'money'        => (string) $order['amount'],
        ];
        $params['sign']      = $this->sign($params, (string) ($config['key'] ?? ''));
        $params['sign_type'] = 'MD5';

        $gateway = rtrim((string) ($config['gateway'] ?? ''), '/');

        return [
            'method' => 'GET',
            'url'    => $gateway . '/submit.php',
            'params' => $params,
        ];
    }

    public function verify(array $params, array $config): bool
    {
        // 缺/空/非标量 sign 一律拒绝;空密钥也视为不可信(fail-closed,防误配)
        if (empty($params['sign']) || !is_scalar($params['sign'])) {
            return false;
        }
        $key = (string) ($config['key'] ?? '');
        if ($key === '') {
            return false;
        }
        $given = (string) $params['sign'];
        $calc  = $this->sign($params, $key);

        return hash_equals($calc, $given);
    }

    public function parse(array $params): array
    {
        return [
            'out_trade_no'     => (string) ($params['out_trade_no'] ?? ''),
            'channel_trade_no' => (string) ($params['trade_no'] ?? ''),
            'amount'           => (string) ($params['money'] ?? ''),
            'currency'         => (string) ($params['currency'] ?? 'CNY'), // 易支付无币种字段,默认 CNY
            'success'          => ($params['trade_status'] ?? '') === 'TRADE_SUCCESS',
        ];
    }

    public function successResponse(): string
    {
        return 'success';
    }

    public function failResponse(): string
    {
        return 'fail';
    }

    /**
     * 计算签名。
     */
    private function sign(array $params, string $key): string
    {
        unset($params['sign'], $params['sign_type']);
        // 仅保留非空标量参与签名(数组/对象等非法入参一律剔除,避免 'Array' 隐式转换)
        $params = array_filter($params, static fn($v) => is_scalar($v) && $v !== '');
        ksort($params);

        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }

        return md5(implode('&', $parts) . $key);
    }
}
