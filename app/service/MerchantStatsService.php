<?php
declare(strict_types=1);

namespace app\service;

use app\model\MerchantFundLog;
use app\model\Order;
use app\util\Money;

/**
 * 商户统计(只读)。口径:销售额/订单数仅计已支付+已发货订单(剔除待支付/关闭/退款/异常),
 * 时间按 create_time 半开区间 [start, end)。
 * 毛利口径:已发货销售额 − 平台抽佣(同期),即商户实得(扣佣后)。
 */
class MerchantStatsService
{
    private const PAID_STATUSES = [Order::STATUS_PAID, Order::STATUS_DELIVERED];

    public function summary(int $merchantId, string $start = '', string $end = ''): array
    {
        $sales = $this->rangeQuery($merchantId, $start, $end)->sum('total_amount');
        $count = $this->rangeQuery($merchantId, $start, $end)->count();

        // 今日 = create_time ∈ [今日 00:00, 明日 00:00);昨日 = [昨日 00:00, 今日 00:00);本月 = [本月 1 号 00:00, 明日 00:00)
        $todayStart     = date('Y-m-d 00:00:00');
        $tomorrow       = date('Y-m-d 00:00:00', strtotime('+1 day'));
        $yesterdayStart = date('Y-m-d 00:00:00', strtotime('-1 day'));
        $monthStart     = date('Y-m-01 00:00:00');

        // 销售额口径:已发货(DELIVERED)total_amount 合计(同平台仪表盘);订单数同 summary 口径(已支付+已发货)
        $salesToday     = (string) $this->deliveredQuery($merchantId, $todayStart, $tomorrow)->sum('total_amount');
        $salesYesterday = (string) $this->deliveredQuery($merchantId, $yesterdayStart, $todayStart)->sum('total_amount');
        $salesMonth     = (string) $this->deliveredQuery($merchantId, $monthStart, $tomorrow)->sum('total_amount');
        $ordersToday    = $this->rangeQuery($merchantId, $todayStart, $tomorrow)->count();
        $ordersYesterday = $this->rangeQuery($merchantId, $yesterdayStart, $todayStart)->count();

        // 毛利 = 已发货销售额 − 平台抽佣(同期),即商户扣佣后实得
        $profitToday     = Money::sub(Money::add($salesToday, '0'), $this->commission($merchantId, $todayStart, $tomorrow));
        $profitYesterday = Money::sub(Money::add($salesYesterday, '0'), $this->commission($merchantId, $yesterdayStart, $todayStart));
        $profitMonth     = Money::sub(Money::add($salesMonth, '0'), $this->commission($merchantId, $monthStart, $tomorrow));

        return [
            // SUM 经 DB 返回,统一规整为两位小数字符串(与 AdminReportService 对账口径一致)
            'sales'           => Money::add((string) $sales, '0'),
            'order_count'     => $count,
            'sales_today'     => Money::add($salesToday, '0'),
            'sales_yesterday' => Money::add($salesYesterday, '0'),
            'orders_today'    => $ordersToday,
            'orders_yesterday' => $ordersYesterday,
            // 毛利(扣佣后实得):今日 / 昨日 / 本月
            'profit_today'     => $profitToday,
            'profit_yesterday' => $profitYesterday,
            'profit_month'     => $profitMonth,
        ];
    }

    /**
     * 本商户平台抽佣合计(取绝对值)。佣金流水 amount 存负数(口径同 AdminViewService)。
     * create_time 半开区间 [start, end);为空则不限。返回 Money 两位小数字符串。
     */
    private function commission(int $merchantId, string $start, string $end): string
    {
        $q = MerchantFundLog::where('merchant_id', $merchantId)
            ->where('type', MerchantFundLog::TYPE_COMMISSION);
        if ($start !== '') {
            $q->where('create_time', '>=', $start);
        }
        if ($end !== '') {
            $q->where('create_time', '<', $end);
        }
        $sum = Money::add((string) $q->sum('amount'), '0');
        return Money::cmp($sum, '0') < 0 ? Money::sub('0', $sum) : $sum;
    }

    /**
     * 已发货(DELIVERED)订单查询,限定本商户,create_time 半开区间 [start, end)。
     * 用于今日/昨日销售额口径(与平台仪表盘一致)。
     */
    private function deliveredQuery(int $merchantId, string $start, string $end)
    {
        return Order::where('merchant_id', $merchantId)
            ->where('status', Order::STATUS_DELIVERED)
            ->where('create_time', '>=', $start)
            ->where('create_time', '<', $end);
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
