<?php
declare(strict_types=1);

namespace app\service;

use app\model\AccessToken;
use app\util\Token;

/**
 * 登录令牌服务:签发(仅存哈希 + 过期)、校验、撤销。
 *
 * 明文 token 只在签发时返回给客户端,库内仅存 SHA-256 哈希;
 * 校验时哈希后比对,过期即失效。
 */
class TokenService
{
    /** 默认有效期(秒):1 天 */
    public const DEFAULT_TTL = 86400;

    /**
     * 签发令牌,返回明文 token(仅此一次)。
     */
    public function issue(string $ownerType, int $ownerId, int $ttlSeconds = self::DEFAULT_TTL): string
    {
        $token = Token::generate();

        AccessToken::create([
            'owner_type' => $ownerType,
            'owner_id'   => $ownerId,
            'token_hash' => Token::hash($token),
            'expires_at' => date('Y-m-d H:i:s', time() + $ttlSeconds),
        ]);

        return $token;
    }

    /**
     * 校验令牌。有效则返回 ['owner_type','owner_id','token_id'],否则 null。
     */
    public function verify(string $token): ?array
    {
        if ($token === '') {
            return null;
        }

        $row = AccessToken::where('token_hash', Token::hash($token))->find();
        if (!$row) {
            return null;
        }
        if (strtotime($row->expires_at) <= time()) {
            return null;
        }

        return [
            'owner_type' => $row->owner_type,
            'owner_id'   => (int) $row->owner_id,
            'token_id'   => (int) $row->id,
        ];
    }

    /**
     * 撤销单个令牌。
     */
    public function revoke(string $token): void
    {
        AccessToken::where('token_hash', Token::hash($token))->delete();
    }

    /**
     * 撤销某主体的全部令牌(改密/冻结时调用)。
     */
    public function revokeAllFor(string $ownerType, int $ownerId): void
    {
        AccessToken::where('owner_type', $ownerType)->where('owner_id', $ownerId)->delete();
    }

    /**
     * 清理已过期令牌,返回清理条数。
     */
    public function purgeExpired(): int
    {
        return AccessToken::where('expires_at', '<=', date('Y-m-d H:i:s'))->delete();
    }
}
