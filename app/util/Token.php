<?php
declare(strict_types=1);

namespace app\util;

/**
 * 令牌工具。
 *
 * - generate():64 位十六进制随机明文 token(发给客户端)。
 * - hash():SHA-256,数据库仅存哈希(明文泄露即失效)。
 * - verify():定长时间比较,防时序攻击。
 */
class Token
{
    public static function generate(): string
    {
        return bin2hex(random_bytes(32)); // 32 字节 → 64 hex
    }

    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function verify(string $token, string $hash): bool
    {
        return hash_equals($hash, self::hash($token));
    }
}
