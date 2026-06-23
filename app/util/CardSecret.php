<?php
declare(strict_types=1);

namespace app\util;

/**
 * 卡密落库加密(AES-256-GCM,认证加密)。
 *
 * 设计原则:
 * - **opt-in**:仅当配置了 CARD_SECRET_KEY(环境变量)时才加密;未配置则原样明文存储,
 *   行为与历史一致(向后兼容,零风险)。
 * - **向后兼容解密**:decrypt() 仅对带 `enc:v1:` 前缀的密文解密,其余(老明文卡)原样返回。
 *   因此加密开启前后、新旧卡可混存,发卡读取一律走 decrypt() 都正确。
 * - secret_hash(去重)始终对**明文**取 SHA-256(在加密前计算),加密不影响去重。
 *
 * 安全提示:CARD_SECRET_KEY 一经用于加密卡密,**不可更改/丢失**,否则旧密文无法解密。
 */
class CardSecret
{
    private const PREFIX = 'enc:v1:';

    /** 配置的派生密钥(32 字节);未配置返回 null = 不加密。 */
    private static function key(): ?string
    {
        $k = (string) (getenv('CARD_SECRET_KEY') ?: '');
        if ($k === '') {
            return null;
        }
        // 派生定长 32 字节密钥(与原始串解耦)
        return hash('sha256', 'qfk-card-secret:' . $k, true);
    }

    /** 加密(未配置密钥则原样返回明文)。 */
    public static function encrypt(string $plain): string
    {
        if ($plain === '') {
            return $plain;
        }
        $key = self::key();
        if ($key === null || !function_exists('openssl_encrypt')) {
            return $plain;
        }
        $iv  = random_bytes(12); // GCM 12 字节 nonce
        $tag = '';
        $ct  = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if ($ct === false) {
            return $plain; // 加密失败兜底:退化为明文,不阻塞发卡
        }
        return self::PREFIX . base64_encode($iv . $tag . $ct);
    }

    /** 解密(非密文/老明文原样返回;解密失败原样返回,绝不抛异常)。 */
    public static function decrypt(string $stored): string
    {
        if (strncmp($stored, self::PREFIX, strlen(self::PREFIX)) !== 0) {
            return $stored; // 明文(老卡或未启用加密)
        }
        $key = self::key();
        if ($key === null || !function_exists('openssl_decrypt')) {
            return $stored;
        }
        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if ($raw === false || strlen($raw) < 28) {
            return $stored;
        }
        $iv  = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $ct  = substr($raw, 28);
        $pt  = openssl_decrypt($ct, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return $pt === false ? $stored : $pt;
    }

    /** 是否为本工具加密后的密文。 */
    public static function isEncrypted(string $stored): bool
    {
        return strncmp($stored, self::PREFIX, strlen(self::PREFIX)) === 0;
    }
}
