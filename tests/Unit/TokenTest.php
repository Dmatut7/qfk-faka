<?php
declare(strict_types=1);

namespace tests\Unit;

use app\util\Token;
use PHPUnit\Framework\TestCase;

/**
 * 令牌工具 (T1.4):明文随机 token + SHA-256 哈希(仅存哈希)。
 */
class TokenTest extends TestCase
{
    public function testGenerateIsRandom64Hex(): void
    {
        $a = Token::generate();
        $b = Token::generate();
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $a);
        $this->assertNotSame($a, $b, '两次生成应不同');
    }

    public function testHashIsDeterministicAndNotPlaintext(): void
    {
        $token = Token::generate();
        $hash = Token::hash($token);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $hash);
        $this->assertSame($hash, Token::hash($token), '同输入哈希稳定');
        $this->assertNotSame($token, $hash, '存储的是哈希而非明文');
    }

    public function testVerify(): void
    {
        $token = Token::generate();
        $hash = Token::hash($token);
        $this->assertTrue(Token::verify($token, $hash));
        $this->assertFalse(Token::verify($token . 'x', $hash));
        $this->assertFalse(Token::verify('deadbeef', $hash));
    }
}
