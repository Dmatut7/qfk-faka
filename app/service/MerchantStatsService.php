<?php
declare(strict_types=1);

namespace app\service;

use app\model\Order;
use app\util\Money;

/**
 * 商户统计(只读)。口径:销售额/订单数仅计已支付+已发货订单(剔除待支付/关闭/退款/异常),
 * 时间按 create_time 半开区间 [start, end)。
 */
class MerchantStatsService
{
    private const PAID_STATUSES = [Order::STATUS_PAID, Order::STATUS_DELIVERED];

    public function summary(int $merchantId, string $start = '', string $end = ''): array
    {
        $sales = $this->rangeQuery($merchantId, $start, $end)->sum('total_amount');
        $count = $this->rangeQuery($merchantId, $start, $end)->count();

        return [
            // SUM 经 DB 返回,统一规整为两位小数字符串(与 AdminReportService 对账口径一致)
            'sales'       => Money::add((string) $sales, '0'),
            'order_count' => $count,
        ];
    }

    public function topProducts(int $merchantId, string $start = '', string $end = '', int $limit = 10): array
    {
        $rows = $this->rangeQuery($merchantId, $start, $end)
            ->field('product_id, COUNT(*) AS order_count, SUM(quantity) AS qty, SUM(total_amount) AS sales')
            ->group('product_id')
            ->order('qty', 'desc')
            ->limit(max(1, min(50, $limit)))
            ->select()
            ->toArray();

        foreach ($rows as &$r) {
            // SUM 经 DB 返回,统一规整为两位小数字符串(与对账口径一致)
            $r['sales'] = Money::add((string) $r['sales'], '0');
        }
        unset($r);

        return $rows;
    }

    private function rangeQuery(int $merchantId, string $start, string $end)
    {
        $q = Order::where('merchant_id', $merchantId)->whereIn('status', self::PAID_STATUSES);
        if ($start !== '') {
            $q->where('create_time', '>=', $start);
        }
        if ($end !== '') {
            $q->where('create_time', '<', $end); // 半开区间
        }
        return $q;
    }
}
