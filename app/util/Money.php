<?php
declare(strict_types=1);

namespace app\util;

/**
 * 金额工具 —— bcmath 封装,统一 scale=2(元,两位小数)。
 *
 * 全平台金额加减乘比一律走此类,禁止浮点运算(见 CLAUDE.md / spec §1.5)。
 * 入参接受 string|int|float(内部转 string 交给 bcmath),输出恒为 2 位小数字符串。
 */
class Money
{
    public const SCALE = 2;

    /** 高精度中间运算 scale,乘法等先在高精度计算再四舍五入到 2 位 */
    private const CALC_SCALE = 12;

    private static function s($n): string
    {
        // 统一为 bcmath 可解析的字符串;float 用足够精度格式化避免科学计数法
        if (is_float($n)) {
            return number_format($n, self::CALC_SCALE, '.', '');
        }
        return (string) $n;
    }

    public static function add($a, $b): string
    {
        return bcadd(self::s($a), self::s($b), self::SCALE);
    }

    public static function sub($a, $b): string
    {
        return bcsub(self::s($a), self::s($b), self::SCALE);
    }

    /** 乘法:高精度相乘后四舍五入到 2 位(适用于售价×数量、总额×佣金率等) */
    public static function mul($a, $b): string
    {
        $raw = bcmul(self::s($a), self::s($b), self::CALC_SCALE);
        return self::round($raw, self::SCALE);
    }

    /** 比较:-1 / 0 / 1,按 scale=2 比较 */
    public static function cmp($a, $b): int
    {
        return bccomp(self::s($a), self::s($b), self::SCALE);
    }

    /** 四舍五入(half-up)到指定小数位,返回字符串 */
    public static function round($num, int $scale = self::SCALE): string
    {
        $n = self::s($num);
        $half = '0.' . str_repeat('0', $scale) . '5'; // 例如 scale=2 → 0.005
        if (bccomp($n, '0', self::CALC_SCALE) >= 0) {
            return bcadd($n, $half, $scale);
        }
        return bcsub($n, $half, $scale);
    }
}
