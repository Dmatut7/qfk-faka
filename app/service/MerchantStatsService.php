<?php
declare(strict_types=1);

namespace app\service;

use app\model\Order;

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
            'sales'       => number_format((float) $sales, 2, '.', ''),
            'order_count' => $count,
        ];
    }

    public function topProducts(int $merchantId, string $start = '', string $end = '', int $limit = 10): array
    {
        return $this->rangeQuery($merchantId, $start, $end)
            ->field('product_id, COUNT(*) AS order_count, SUM(quantity) AS qty, SUM(total_amount) AS sales')
            ->group('product_id')
            ->order('qty', 'desc')
            ->limit(max(1, min(50, $limit)))
            ->select()
            ->toArray();
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
