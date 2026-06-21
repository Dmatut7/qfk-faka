<?php
declare(strict_types=1);

namespace tests\Unit;

use app\util\Money;
use PHPUnit\Framework\TestCase;

/**
 * 金额工具 (T1.4, TDD)。所有结果均为 scale=2 字符串,杜绝浮点误差。
 */
class MoneyTest extends TestCase
{
    public function testAddAvoidsFloatError(): void
    {
        // 浮点下 0.1+0.2=0.30000000000000004
        $this->assertSame('0.30', Money::add('0.1', '0.2'));
        $this->assertSame('8.00', Money::add('5', '3'));
        $this->assertSame('100.00', Money::add('99.99', '0.01'));
    }

    public function testSub(): void
    {
        $this->assertSame('0.20', Money::sub('0.30', '0.10'));
        $this->assertSame('-1.50', Money::sub('1.00', '2.50'));
    }

    public function testMulRoundsHalfUpToTwoDecimals(): void
    {
        $this->assertSame('30.00', Money::mul('10', '3'));
        $this->assertSame('5.88', Money::mul('100', '0.0588'));   // 5.88 精确
        $this->assertSame('5.88', Money::mul('99.99', '0.0588')); // 5.879412 → 5.88
        $this->assertSame('1.00', Money::mul('3', '0.333'));      // 0.999 → 1.00
        $this->assertSame('0.33', Money::mul('1', '0.333'));      // 0.333 → 0.33
    }

    public function testCmpAtScaleTwo(): void
    {
        $this->assertSame(0, Money::cmp('1.00', '1.00'));
        $this->assertSame(0, Money::cmp('1.10', '1.1'));
        $this->assertSame(1, Money::cmp('1.01', '1.00'));
        $this->assertSame(-1, Money::cmp('1.00', '1.01'));
    }

    public function testRoundHalfUp(): void
    {
        $this->assertSame('5.89', Money::round('5.885'));
        $this->assertSame('5.88', Money::round('5.884'));
        $this->assertSame('-5.89', Money::round('-5.885'));
        $this->assertSame('5.01', Money::round('5.005'));
        $this->assertSame('10.00', Money::round('10'));
    }
}
