<?php
declare(strict_types=1);

namespace app\service;

use app\model\Order;
use app\model\Product;

/**
 * 平台跨商户只读视图:跨商户订单 / 商品查询。只读,不改任何状态。
 */
class AdminViewService
{
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
