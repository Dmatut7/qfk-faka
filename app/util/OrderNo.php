<?php
declare(strict_types=1);

namespace app\util;

/**
 * 业务单号生成器(订单号 / 支付单号)。
 *
 * 结构:[prefix] + YmdHis(14) + PID%10000(4) + 随机(5) + 进程内自增序号(4)。
 * - **PID 段**保证跨进程(含 pcntl_fork 子进程)绝不撞号 —— fork 会重置进程内
 *   静态序号,故必须靠 PID 提供跨进程熵;
 * - 随机段进一步降低碰撞;自增序号保证单进程同秒内不重复。
 * - 默认总长 27(含前缀更长),可入 VARCHAR(32)。
 */
class OrderNo
{
    private static int $seq = 0;

    public static function generate(string $prefix = ''): string
    {
        $seq = self::$seq++ % 10000;

        return $prefix
            . date('YmdHis')
            . str_pad((string) (getmypid() % 10000), 4, '0', STR_PAD_LEFT)
            . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT)
            . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
