<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Complaint;
use app\model\Order;
use think\facade\Db;

/**
 * 投诉/售后:买家发起 → 商户回复 → 买家申请平台介入 → 平台裁决(可联动退款)。
 * 买家操作以 order_no + 邮箱核验归属;商户/平台操作各自鉴权。
 */
class ComplaintService
{
    /** 可投诉的订单状态:已收款(已支付/发货/异常/已退款均可申诉) */
    private const COMPLAINABLE = [Order::STATUS_PAID, Order::STATUS_DELIVERED, Order::STATUS_EXCEPTION, Order::STATUS_REFUNDED];

    /** 每订单投诉总数上限(含已终结):防对已驳回/已解决订单无限重开刷量 */
    private const MAX_PER_ORDER = 5;

    // ===== 买家 =====

    public function file(string $orderNo, string $email, int $type, string $description): Complaint
    {
        $order = $this->verifyOrder($orderNo, $email);
        if (!in_array((int) $order->status, self::COMPLAINABLE, true)) {
            throw new BizException(Code::STATE_INVALID, '该订单状态不支持投诉');
        }
        if (Complaint::where('order_id', $order->id)->whereIn('status', Complaint::ACTIVE)->find()) {
            throw new BizException(Code::STATE_INVALID, '该订单已有处理中的投诉');
        }
        // M4 防刷:每订单投诉总数上限(含已驳回/已解决),避免无限重开
        if (Complaint::where('order_id', $order->id)->count() >= self::MAX_PER_ORDER) {
            throw new BizException(Code::STATE_INVALID, '该订单投诉次数已达上限,请联系平台客服');
        }
        $desc = trim($description);
        if ($desc === '') {
            throw new BizException(Code::PARAM_ERROR, '请填写问题描述');
        }
        return Complaint::create([
            'order_id'    => (int) $order->id,
            'order_no'    => $order->order_no,
            'merchant_id' => (int) $order->merchant_id,
            'buyer_email' => trim($email),
            'type'        => in_array($type, Complaint::TYPES, true) ? $type : Complaint::TYPE_OTHER,
            'description' => $desc,
            'status'      => Complaint::STATUS_OPEN,
        ]);
    }

    public function listByOrder(string $orderNo, string $email): array
    {
        $order = $this->verifyOrder($orderNo, $email);
        return Complaint::where('order_id', $order->id)->order('id', 'desc')->select()->toArray();
    }

    /** 买家申请平台介入:进行中的投诉 OPEN/REPLIED → INTERVENE */
    public function escalate(string $orderNo, string $email, int $id): Complaint
    {
        $order = $this->verifyOrder($orderNo, $email);
        $c = Complaint::where('id', $id)->where('order_id', $order->id)->find();
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '投诉不存在');
        }
        if (!in_array((int) $c->status, [Complaint::STATUS_OPEN, Complaint::STATUS_REPLIED], true)) {
            throw new BizException(Code::STATE_INVALID, '当前状态不可申请介入');
        }
        $c->save(['status' => Complaint::STATUS_INTERVENE]);
        return $c;
    }

    // ===== 商户 =====

    public function merchantList(int $merchantId, ?int $status = null): array
    {
        $q = Complaint::where('merchant_id', $merchantId)->order('id', 'desc');
        if ($status !== null) {
            $q->where('status', $status);
        }
        return $q->select()->toArray();
    }

    /** 商户回复:进行中投诉写回复,OPEN→REPLIED(介入中仍可补充回复但不改状态) */
    public function merchantReply(int $merchantId, int $id, string $reply): Complaint
    {
        $c = $this->ownedActive($merchantId, $id);
        $reply = trim($reply);
        if ($reply === '') {
            throw new BizException(Code::PARAM_ERROR, '请填写回复内容');
        }
        $patch = ['merchant_reply' => $reply];
        if ((int) $c->status === Complaint::STATUS_OPEN) {
            $patch['status'] = Complaint::STATUS_REPLIED;
        }
        $c->save($patch);
        return $c;
    }

    // ===== 平台 =====

    /**
     * 平台投诉列表 + 全局各状态计数。
     * status_counts 反映全局(忽略 status 筛选、保留 merchant 筛选)各状态总数,
     * 让统计卡不随分页/所选状态 tab 失真。口径同 AdminViewService::orders。
     *
     * @return array{items: array, status_counts: array<int,int>}
     */
    public function adminList(?int $status = null, ?int $merchantId = null): array
    {
        // 非 status 的基础筛选(merchant_id);供"列表"与"全局状态计数"共用
        $applyBase = function ($q) use ($merchantId) {
            if ($merchantId !== null) {
                $q->where('merchant_id', $merchantId);
            }
            return $q;
        };

        // 全局各状态计数(忽略 status 筛选)
        $rows = $applyBase(Complaint::field('status, COUNT(*) AS c'))->group('status')->select()->toArray();
        $statusCounts = [];
        foreach ($rows as $r) {
            $statusCounts[(int) $r['status']] = (int) $r['c'];
        }

        $q = $applyBase(Complaint::order('id', 'desc'));
        if ($status !== null) {
            $q->where('status', $status);
        }
        $items = $q->select()->toArray();

        return ['items' => $items, 'status_counts' => $statusCounts];
    }

    /** 平台裁决-解决,refund=true 时联动退款(订单可退则退,已退则仅标记) */
    public function adminResolve(int $id, string $remark, bool $refund): Complaint
    {
        return Db::transaction(function () use ($id, $remark, $refund) {
            $c = $this->activeById($id);
            $refunded = (int) $c->refunded;

            if ($refund) {
                $order = Order::find($c->order_id);
                if ($order && (int) $order->status === Order::STATUS_REFUNDED) {
                    $refunded = 1; // 已退,仅标记
                } elseif ($order && in_array((int) $order->status, [Order::STATUS_PAID, Order::STATUS_DELIVERED, Order::STATUS_EXCEPTION], true)) {
                    (new RefundService())->refund((int) $c->order_id, '投诉裁决退款' . ($remark !== '' ? ':' . $remark : ''));
                    $refunded = 1;
                } else {
                    throw new BizException(Code::STATE_INVALID, '订单状态不可退款');
                }
            }

            $c->save([
                'status'       => Complaint::STATUS_RESOLVED,
                'admin_remark' => trim($remark),
                'refunded'     => $refunded,
            ]);
            return $c;
        });
    }

    /** 平台裁决-驳回 */
    public function adminReject(int $id, string $remark): Complaint
    {
        $c = $this->activeById($id);
        $c->save(['status' => Complaint::STATUS_REJECTED, 'admin_remark' => trim($remark)]);
        return $c;
    }

    // ===== 内部 =====

    private function verifyOrder(string $orderNo, string $email): Order
    {
        $order = Order::where('order_no', trim($orderNo))->find();
        if (!$order) {
            throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
        }
        if (strcasecmp((string) $order->buyer_email, trim($email)) !== 0) {
            throw new BizException(Code::FORBIDDEN, '邮箱与订单不匹配');
        }
        return $order;
    }

    private function ownedActive(int $merchantId, int $id): Complaint
    {
        $c = Complaint::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '投诉不存在');
        }
        if ((int) $c->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人投诉');
        }
        if (!$c->isActive()) {
            throw new BizException(Code::STATE_INVALID, '投诉已结束');
        }
        return $c;
    }

    private function activeById(int $id): Complaint
    {
        $c = Complaint::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '投诉不存在');
        }
        if (!$c->isActive()) {
            throw new BizException(Code::STATE_INVALID, '投诉已结束');
        }
        return $c;
    }
}
