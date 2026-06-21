<?php
declare(strict_types=1);

namespace app\service;

use app\model\Card;
use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use app\model\Withdrawal;
use app\util\Money;

/**
 * 平台跨商户只读视图:跨商户订单 / 商品查询 + 平台仪表盘聚合。只读,不改任何状态。
 */
class AdminViewService
{
    /**
     * 平台仪表盘聚合。时间口径统一:今日 = create_time 当天 [今日 00:00, 明日 00:00)。
     * 销售额用已发货(DELIVERED)订单 total_amount 合计,返回 Money 两位小数字符串。
     *
     * @return array{
     *   merchants: array{total:int, pending:int, active:int, frozen:int},
     *   orders: array{total:int, today:int, paid:int, delivered:int},
     *   sales: array{total:string, today:string},
     *   withdrawals: array{pending_count:int, pending_amount:string},
     *   products: array{total:int, on_sale:int},
     *   cards: array{unsold:int}
     * }
     */
    public function dashboard(): array
    {
        $todayStart = date('Y-m-d 00:00:00');
        $tomorrow   = date('Y-m-d 00:00:00', strtotime('+1 day'));

        $deliveredSalesTotal = (string) Order::where('status', Order::STATUS_DELIVERED)->sum('total_amount');
        $deliveredSalesToday = (string) Order::where('status', Order::STATUS_DELIVERED)
            ->where('create_time', '>=', $todayStart)
            ->where('create_time', '<', $tomorrow)
            ->sum('total_amount');

        $pendingAmount = (string) Withdrawal::where('status', Withdrawal::STATUS_PENDING)->sum('amount');

        return [
            'merchants' => [
                'total'   => Merchant::count(),
                'pending' => Merchant::where('status', Merchant::STATUS_PENDING)->count(),
                'active'  => Merchant::where('status', Merchant::STATUS_ACTIVE)->count(),
                'frozen'  => Merchant::where('status', Merchant::STATUS_FROZEN)->count(),
            ],
            'orders' => [
                'total'     => Order::count(),
                'today'     => Order::where('create_time', '>=', $todayStart)->where('create_time', '<', $tomorrow)->count(),
                'paid'      => Order::where('status', Order::STATUS_PAID)->count(),
                'delivered' => Order::where('status', Order::STATUS_DELIVERED)->count(),
            ],
            'sales' => [
                // sum() 可能返回 0(int)或字符串,统一规整为两位小数字符串
                'total' => Money::add($deliveredSalesTotal, '0'),
                'today' => Money::add($deliveredSalesToday, '0'),
            ],
            'withdrawals' => [
                'pending_count'  => Withdrawal::where('status', Withdrawal::STATUS_PENDING)->count(),
                'pending_amount' => Money::add($pendingAmount, '0'),
            ],
            'products' => [
                'total'   => Product::count(),
                'on_sale' => Product::where('status', Product::STATUS_ON)->count(),
            ],
            'cards' => [
                'unsold' => Card::where('status', Card::STATUS_UNSOLD)->count(),
            ],
        ];
    }

    /**
     * 跨商户订单查询,可按 merchant_id / status / order_no 筛选,分页,按 id desc。
     */
    public function orders(array $filter, int $page = 1, int $size = 20): array
    {
        $q = Order::order('id', 'desc');
        if (isset($filter['merchant_id']) && $filter['merchant_id'] !== '') {
            $q->where('merchant_id', (int) $filter['merchant_id']);
        }
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        if (!empty($filter['order_no'])) {
            $q->where('order_no', $filter['order_no']);
        }
        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /**
     * 跨商户商品查询,可按 merchant_id / status / keyword(title like)筛选,分页,按 id desc。
     */
    public function products(array $filter, int $page = 1, int $size = 20): array
    {
        $q = Product::order('id', 'desc');
        if (isset($filter['merchant_id']) && $filter['merchant_id'] !== '') {
            $q->where('merchant_id', (int) $filter['merchant_id']);
        }
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        if (!empty($filter['keyword'])) {
            $q->where('title', 'like', '%' . $filter['keyword'] . '%');
        }
        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }
}
