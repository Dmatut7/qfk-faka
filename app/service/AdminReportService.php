<?php
declare(strict_types=1);

namespace app\service;

use app\model\MerchantFundLog;
use app\model\Order;
use app\util\Money;

/**
 * 平台对账报表(只读,跨商户)。
 *
 * 口径与 app\service\MerchantStatsService 一致:
 * - 时间按 create_time 半开区间 [start, end);start/end 为空则不限。
 * - 销售额:已支付(PAID)+ 已发货(DELIVERED)订单 total_amount 之和。
 * - 平台佣金:MerchantFundLog 中 type=TYPE_COMMISSION 的 amount 绝对值之和
 *   (commission 流水 amount 存的是负数,这里取正展示)。
 */
class AdminReportService
{
    private const PAID_STATUSES = [Order::STATUS_PAID, Order::STATUS_DELIVERED];

    /**
     * 跨商户结算汇总,按商户分组。
     *
     * @return array{
     *   total: array{sales:string, commission:string},
     *   items: array<int, array{merchant_id:int, sales:string, commission:string}>
     * }
     */
    public function settlementReport(string $start = '', string $end = ''): array
    {
        $sales      = $this->salesByMerchant($start, $end);      // merchant_id => sales(string)
        $commission = $this->commissionByMerchant($start, $end); // merchant_id => commission(string, 正)

        $merchantIds = array_unique(array_merge(array_keys($sales), array_keys($commission)));
        sort($merchantIds);

        $items         = [];
        $totalSales    = '0.00';
        $totalCommission = '0.00';
        foreach ($merchantIds as $mid) {
            $s = $sales[$mid] ?? '0.00';
            $c = $commission[$mid] ?? '0.00';
            $items[] = [
                'merchant_id' => (int) $mid,
                'sales'       => $s,
                'commission'  => $c,
            ];
            $totalSales      = Money::add($totalSales, $s);
            $totalCommission = Money::add($totalCommission, $c);
        }

        return [
            'total' => ['sales' => $totalSales, 'commission' => $totalCommission],
            'items' => $items,
        ];
    }

    /** @return array<int,string> merchant_id => sales */
    private function salesByMerchant(string $start, string $end): array
    {
        $q = Order::whereIn('status', self::PAID_STATUSES);
        $this->applyRange($q, $start, $end);

        $rows = $q->field('merchant_id, SUM(total_amount) AS sales')
            ->group('merchant_id')
            ->select()
            ->toArray();

        $out = [];
        foreach ($rows as $r) {
            // SUM 经 DB 返回,统一规整为两位小数字符串
            $out[(int) $r['merchant_id']] = Money::add((string) $r['sales'], '0');
        }
        return $out;
    }

    /** @return array<int,string> merchant_id => commission(绝对值,正) */
    private function commissionByMerchant(string $start, string $end): array
    {
        $q = MerchantFundLog::where('type', MerchantFundLog::TYPE_COMMISSION);
        $this->applyRange($q, $start, $end);

        $rows = $q->field('merchant_id, SUM(amount) AS commission')
            ->group('merchant_id')
            ->select()
            ->toArray();

        $out = [];
        foreach ($rows as $r) {
            // amount 为负数,绝对值即平台佣金
            $sum = Money::add((string) $r['commission'], '0');
            $out[(int) $r['merchant_id']] = Money::cmp($sum, '0') < 0 ? Money::sub('0', $sum) : $sum;
        }
        return $out;
    }

    private function applyRange($q, string $start, string $end): void
    {
        if ($start !== '') {
            $q->where('create_time', '>=', $start);
        }
        if ($end !== '') {
            $q->where('create_time', '<', $end); // 半开区间
        }
    }
}
