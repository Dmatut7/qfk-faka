<?php
declare(strict_types=1);

namespace tests\Unit;

use app\util\OrderNo;
use PHPUnit\Framework\TestCase;

/**
 * 订单号生成 (T1.4)。日期前缀 + 唯一后缀,长度可入 VARCHAR(32)。
 */
class OrderNoTest extends TestCase
{
    public function testFormatAndDatePrefix(): void
    {
        $no = OrderNo::generate();
        $this->assertMatchesRegularExpression('/^\d{22}$/', $no);
        $this->assertStringStartsWith(date('Ymd'), $no);
        $this->assertLessThanOrEqual(32, strlen($no));
    }

    public function testPrefix(): void
    {
        $no = OrderNo::generate('PAY');
        $this->assertStringStartsWith('PAY' . date('Ymd'), $no);
        $this->assertLessThanOrEqual(32, strlen($no));
    }

    public function testUniquenessInTightLoop(): void
    {
        $set = [];
        for ($i = 0; $i < 3000; $i++) {
            $set[] = OrderNo::generate();
        }
        $this->assertCount(3000, array_unique($set), '批量生成不得重复');
    }
}
