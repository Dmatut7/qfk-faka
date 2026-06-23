<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Product;
use app\util\Money;
use think\facade\Db;

/**
 * 退款闭环:状态置退款 + 卡密处理 + 反向资金流水(精确依据该订单实际结算流水)。
 * 仅对已收款订单(已支付/已发货/异常)可退;事务 + 行锁 + 状态重查保证幂等与并发安全。
 * 卡密:LOCKED(未交付)回库;SOLD(已交付)作废不回库(spec §10.5,防二次售卖)。
 * 资金(B1 负欠隔离):已结算净额从「逻辑净头寸 balance-debt」冲回,平台佣金回冲;
 *   若货款已被提现致冲回后为负,差额落入 merchants.debt(余额保底 0,有负欠则禁提现)。
 * 优惠券(B2):券额下单即占用,退款**不返还**(已付款单永久占用,防退款循环套券)。
 */
class RefundService
{
    private const REFUNDABLE = [Order::STATUS_PAID, Order::STATUS_DELIVERED, Order::STATUS_EXCEPTION];

    public function refund(int $orderId, string $reason = ''): Order
    {
        return Db::transaction(function () use ($orderId, $reason) {
            $now = date('Y-m-d H:i:s');

            $base = Order::find($orderId);
            if (!$base) {
                throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
            }
            // 锁顺序与下单/回调一致:先锁商品行(串行化闸门),再锁订单行
            Product::where('id', $base->product_id)->lock(true)->find();
            $order = Order::where('id', $orderId)->lock(true)->find();

            if (!in_array((int) $order->status, self::REFUNDABLE, true)) {
                throw new BizException(Code::STATE_INVALID, '该订单状态不可退款');
            }

            // 1) 卡密处理(关键:防同一卡密退款后二次售卖):
            //    - LOCKED(下单预占、尚未交付):可释放回 UNSOLD 并回补库存;
            //    - SOLD(已支付交付、secret 已发给买家):按 spec §10.5「虚拟卡密一般不可回收」,
            //      置作废终态、保留 order_id 归属、不回 UNSOLD、不回补库存——绝不重新进入可售池。
            $lockedRestore = Card::where('order_id', $orderId)->where('status', Card::STATUS_LOCKED)->count();
            if ($lockedRestore > 0) {
                Db::name('cards')->where('order_id', $orderId)->where('status', Card::STATUS_LOCKED)
                    ->update(['status' => Card::STATUS_UNSOLD, 'order_id' => null, 'locked_at' => null, 'sold_at' => null, 'update_time' => $now]);
                Db::name('products')->where('id', $order->product_id)
                    ->update(['stock' => Db::raw("stock + {$lockedRestore}"), 'update_time' => $now]);
            }
            // 已交付卡作废(不可回收、不回库、不回补库存)
            Db::name('cards')->where('order_id', $orderId)->where('status', Card::STATUS_SOLD)
                ->update(['status' => Card::STATUS_DISABLED, 'update_time' => $now]);

            // 2) 反向资金:精确依据该订单实际产生的结算流水(兼容未结算的异常单 → 不反向)
            $incomeSum = Money::add((string) MerchantFundLog::where('order_id', $orderId)->where('type', MerchantFundLog::TYPE_INCOME)->sum('amount'), '0');
            $commSum   = Money::add((string) MerchantFundLog::where('order_id', $orderId)->where('type', MerchantFundLog::TYPE_COMMISSION)->sum('amount'), '0'); // 负数
            $wasSettled = Money::cmp($incomeSum, '0') > 0;

            if ($wasSettled) {
                $merchant = Merchant::where('id', $order->merchant_id)->lock(true)->find();
                // 逻辑净头寸 = balance - debt;冲账在逻辑头寸上做(B1 负欠隔离):
                // 冲收入 -income、佣金回冲 -commSum(commSum 负→加回);结果若为负,
                // 说明该笔货款已被提现,差额落入负欠 debt,余额保底 0——不再把 balance 写成负数。
                $preLogical         = Money::sub((string) $merchant->balance, (string) $merchant->debt);
                $afterIncomeReverse = Money::sub($preLogical, $incomeSum);
                $afterCommReverse   = Money::sub($afterIncomeReverse, $commSum);
                $newBalance = Money::cmp($afterCommReverse, '0') >= 0 ? $afterCommReverse : '0.00';
                $newDebt    = Money::cmp($afterCommReverse, '0') < 0 ? Money::sub('0', $afterCommReverse) : '0.00';
                Db::name('merchants')->where('id', $merchant->id)->update(['balance' => $newBalance, 'debt' => $newDebt, 'update_time' => $now]);

                MerchantFundLog::create([
                    'merchant_id' => $merchant->id, 'type' => MerchantFundLog::TYPE_REFUND,
                    'amount' => Money::sub('0', $incomeSum), 'balance_after' => $afterIncomeReverse, 'order_id' => $order->id,
                    'remark' => '订单退款冲收入 ' . $order->order_no,
                ]);
                MerchantFundLog::create([
                    'merchant_id' => $merchant->id, 'type' => MerchantFundLog::TYPE_COMMISSION,
                    'amount' => Money::sub('0', $commSum), 'balance_after' => $afterCommReverse, 'order_id' => $order->id,
                    'remark' => '退款佣金回冲 ' . $order->order_no,
                ]);
                // 注:B2「下单即占额」后,券额不在退款时返还——已付款订单永久占用其券额
                // (防退款循环反复套同一限量券)。未付款关单的释放在 OrderService::closeAndRelease。
            }

            // 4) 订单置退款
            Db::name('orders')->where('id', $orderId)->update([
                'status'        => Order::STATUS_REFUNDED,
                'refund_reason' => $reason !== '' ? $reason : null,
                'refunded_at'   => $now,
                'update_time'   => $now,
            ]);

            return Order::find($orderId);
        });
    }
}
