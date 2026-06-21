<?php
declare(strict_types=1);

namespace tests\Unit;

use app\service\SettlementService;
use app\util\Money;
use PHPUnit\Framework\TestCase;

/**
 * 结算金额计算 (T6.4a, TDD):佣金 = bcmul(total, rate),入账 = total - 佣金,scale=2。
 */
class SettlementCalcTest extends TestCase
{
    private SettlementService $svc;

    protected function setUp(): void
    {
        $this->svc = new SettlementService();
    }

    public function testExactCommission(): void
    {
        $r = $this->svc->calc('100.00', '0.0588');
        $this->assertSame('5.88', $r['commission']);
        $this->assertSame('94.12', $r['income']);
        // 佣金 + 入账 == 总额
        $this->assertSame(0, Money::cmp(Money::add($r['commission'], $r['income']), '100.00'));
    }

    public function testRoundedCommission(): void
    {
        // 99.99 * 0.0588 = 5.879412 → 半进位 5.88;入账 94.11
        $r = $this->svc->calc('99.99', '0.0588');
        $this->assertSame('5.88', $r['commission']);
        $this->assertSame('94.11', $r['income']);
        $this->assertSame(0, Money::cmp(Money::add($r['commission'], $r['income']), '99.99'));
    }

    public function testZeroRate(): void
    {
        $r = $this->svc->calc('10.00', '0.0000');
        $this->assertSame('0.00', $r['commission']);
        $this->assertSame('10.00', $r['income']);
    }

    public function testFullRate(): void
    {
        $r = $this->svc->calc('10.00', '1.0000');
        $this->assertSame('10.00', $r['commission']);
        $this->assertSame('0.00', $r['income']);
    }

    public function testCommissionPlusIncomeAlwaysEqualsTotal(): void
    {
        foreach (['33.33', '0.01', '1234.56', '7.77'] as $total) {
            foreach (['0.0588', '0.1', '0.15', '0.3333'] as $rate) {
                $r = $this->svc->calc($total, $rate);
                $this->assertSame(0, Money::cmp(Money::add($r['commission'], $r['income']), $total), "total=$total rate=$rate 佣金+入账须==总额");
            }
        }
    }
}
