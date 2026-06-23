<?php
declare(strict_types=1);

namespace app\service;

use app\model\MerchantFundLog;
use app\model\Order;
use app\util\Money;

/**
 * 平台对账报表(只读,跨商户)。
 *
 * 口径(本报表为"已收款成交"对账,与仪表盘 AdminViewService 的"已发货成交"口径不同,勿混用):
 * - 时间按 create_time 半开区间 [start, end);start/end 为空则不限。
 * - 销售额:已支付(PAID)+ 已发货(DELIVERED)订单 total_amount 之和(已收款口径)。
 *   注:AdminViewService 仪表盘的 deliveredSales* 只统计 DELIVERED(已发货口径),二者刻意不同。
 * - 平台佣金:MerchantFundLog 中 type∈{TYPE_COMMISSION, TYPE_REFUND_COMMISSION} 的 amount 之和的绝对值
 *   (结算佣金 amount 存负数、退款回冲存正数;二者求和使被退款订单佣金净额归 0,再取正展示)。
 * - 已知口径限制(M7,待产品确认):退款产生的佣金回冲流水(+A)按 create_time 计入其所在时间窗,
 *   而被退款订单的销售额按订单 create_time 计入原时间窗——跨时间窗退款会使分窗报表出现
 *   "有佣金无销售/有销售无对应佣金"。全时段(不限时间)汇总不受影响。是否改为"期内成交净额"
 *   口径需业务拍板,见 docs/ui-relaunch/bigscan-findings.md。
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
        // 佣金净额 = 结算扣佣(TYPE_COMMISSION,负)+ 退款回冲(TYPE_REFUND_COMMISSION,正);
        // 二者求和使被退款订单的佣金净额归 0,与改 type 前口径一致。
        $q = MerchantFundLog::whereIn('type', [MerchantFundLog::TYPE_COMMISSION, MerchantFundLog::TYPE_REFUND_COMMISSION]);
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
