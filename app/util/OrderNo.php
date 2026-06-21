<?php
declare(strict_types=1);

namespace app\util;

/**
 * 业务单号生成器(订单号 / 支付单号)。
 *
 * 结构:[prefix] + YmdHis(14) + 4 位随机 + 4 位进程内自增序号。
 * - 随机段降低跨进程碰撞;自增序号保证单进程同秒内绝不重复。
 * - 默认总长 22(含前缀更长),可入 VARCHAR(32)。
 */
class OrderNo
{
    private static int $seq = 0;

    public static function generate(string $prefix = ''): string
    {
        $seq = self::$seq++ % 10000;

        return $prefix
            . date('YmdHis')
            . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT)
            . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
