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
        $rows = $this->rangeQuery($merchantId, $start, $end, 'o')
            // 左联商品取标题;商品已删则 title 为 NULL,前端兜底显示 #id
            ->leftJoin('products p', 'p.id = o.product_id')
            ->field('o.product_id, p.title AS product_title, COUNT(*) AS order_count, SUM(o.quantity) AS qty, SUM(o.total_amount) AS sales')
            ->group('o.product_id, p.title')
            ->order('qty', 'desc')
            ->limit(max(1, min(50, $limit)))
            ->select()
            ->toArray();

        foreach ($rows as &$r) {
            // SUM 经 DB 返回,统一规整为两位小数字符串(与对账口径一致)
            $r['sales'] = Money::add((string) $r['sales'], '0');
            // 商品已删 → title 为 null,统一回退空串(前端兜底 #id)
            $r['product_title'] = $r['product_title'] ?? '';
        }
        unset($r);

        return $rows;
    }

    /**
     * @param string $alias 表别名;非空时给条件列加前缀并对查询设置别名,
     *                      用于 topProducts join products(避免 merchant_id/status/create_time 列歧义)
     */
    private function rangeQuery(int $merchantId, string $start, string $end, string $alias = '')
    {
        $prefix = $alias !== '' ? $alias . '.' : '';
        // alias 分支给查询设别名(供 topProducts join);非 alias 分支用普通查询
        $q = $alias !== '' ? Order::alias($alias) : Order::newQuery();
        $q->where($prefix . 'merchant_id', $merchantId)->whereIn($prefix . 'status', self::PAID_STATUSES);
        if ($start !== '') {
            $q->where($prefix . 'create_time', '>=', $start);
        }
        if ($end !== '') {
            $q->where($prefix . 'create_time', '<', $end); // 半开区间
        }
        return $q;
    }
}
