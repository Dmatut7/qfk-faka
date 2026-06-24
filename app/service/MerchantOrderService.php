<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Order;

/**
 * 商户订单查看(列表/详情);关闭与补发委托 OrderService(复用发卡闸门)。
 */
class MerchantOrderService
{
    /** 导出 CSV 行数上限(防大商户导出撑爆内存) */
    private const EXPORT_MAX = 50000;

    public function list(int $merchantId, array $filter, int $page = 1, int $size = 20): array
    {
        $q = $this->applyFilter(Order::where('merchant_id', $merchantId), $filter);
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /**
     * 导出本商户订单为 CSV 字符串(同列表筛选,倒序,上限 EXPORT_MAX)。
     * 仅订单元数据(不含卡密明文——避免一次性批量导出全部卡密)。
     */
    public function exportCsv(int $merchantId, array $filter): string
    {
        $rows = $this->applyFilter(Order::where('merchant_id', $merchantId), $filter)
            ->order('id', 'desc')->limit(self::EXPORT_MAX)->select();

        $statusLabel = [
            Order::STATUS_PENDING => '待支付', Order::STATUS_PAID => '已支付', Order::STATUS_DELIVERED => '已发货',
            Order::STATUS_CLOSED => '已关闭', Order::STATUS_REFUNDED => '已退款', Order::STATUS_EXCEPTION => '异常待人工',
        ];

        $fh = fopen('php://temp', 'r+');
        fwrite($fh, "\xEF\xBB\xBF"); // UTF-8 BOM:让 Excel 正确识别中文
        fputcsv($fh, ['订单号', '状态', '商品', '买家邮箱', '数量', '金额', '下单时间', '发货时间']);
        foreach ($rows as $o) {
            fputcsv($fh, [
                (string) $o->order_no,
                $statusLabel[(int) $o->status] ?? (string) $o->status,
                (string) $o->product_title,
                (string) $o->buyer_email,
                (int) $o->quantity,
                (string) $o->total_amount,
                (string) $o->create_time,
                (string) ($o->delivered_at ?? ''),
            ]);
        }
        rewind($fh);
        $csv = (string) stream_get_contents($fh);
        fclose($fh);

        return $csv;
    }

    private function applyFilter($q, array $filter)
    {
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        if (!empty($filter['order_no'])) {
            $q->where('order_no', $filter['order_no']);
        }
        if (!empty($filter['buyer_email'])) {
            $q->where('buyer_email', $filter['buyer_email']);
        }
        return $q;
    }

    public function detail(int $merchantId, int $orderId): array
    {
        $order = $this->findOwned($merchantId, $orderId);
        $data  = $order->toArray();
        // L16:仅已发货订单暴露卡密,且只取真正售出(SOLD)的卡。
        // 待支付(LOCKED 预占未付款)、已关闭、异常、已退款一律不返回明文,收敛明文暴露面,
        // 与买家侧「仅 DELIVERED 才返回卡密」口径一致。
        $data['cards'] = (int) $order->status === Order::STATUS_DELIVERED
            ? array_map(
                static fn ($s) => \app\util\CardSecret::decrypt((string) $s),
                Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->order('id', 'asc')->column('secret')
            )
            : [];
        return $data;
    }

    public function findOwned(int $merchantId, int $orderId): Order
    {
        $o = Order::find($orderId);
        if (!$o) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        if ((int) $o->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人订单');
        }
        return $o;
    }
}
