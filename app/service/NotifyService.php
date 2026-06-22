<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\Product;
use app\model\SystemLog;
use app\service\pay\PayDriverInterface;
use app\service\pay\PayManager;
use app\util\Money;
use think\facade\Db;
use think\facade\Log;

/**
 * 支付回调处理 —— M6 三大安全保证的落点(spec §10.4):
 *
 *  1) 防伪造:verify() 验签是唯一信任根,验签失败一律拒绝、绝不发货;
 *  2) 防金额篡改:回调实付金额必须 == 订单金额(且 ≥ 支付单金额),否则拒绝;
 *  3) 防重复(幂等):进入事务后对订单行 FOR UPDATE + 锁内重查状态,重复回调只发货一次。
 *
 * 仅当「验签通过 + 归属正确 + 金额一致 + 订单状态合法」才触发发货(卡 1→2)与结算,
 * 整个链路在订单行锁内串行,和 M5 预占逻辑通过同一「商品行锁」闸门衔接,保证并发安全。
 *
 * handle() 返回 ['ack'=>给渠道的应答文案, 'delivered'=>bool, 'code'=>业务码]。
 */
class NotifyService
{
    private const MAX_RETRY = 3;

    public function handle(string $channelCode, array $params): array
    {
        $mgr = new PayManager();

        // 渠道必须存在且受支持(回调侧:停用也处理在途回调,spec §10.4.6)
        $channel = $mgr->channel($channelCode);
        if (!$channel || !$mgr->supports($channelCode)) {
            return $this->ack('fail', false, Code::CHANNEL_UNAVAILABLE);
        }
        $driver = $mgr->driver($channelCode);
        $config = (array) $channel->config;

        // (1) 防伪造:验签
        if (!$driver->verify($params, $config)) {
            $this->log('pay_verify_fail', SystemLog::LEVEL_WARNING, '支付回调验签失败', [
                'channel'      => $channelCode,
                'out_trade_no' => (string) ($params['out_trade_no'] ?? ''),
            ], (string) ($params['out_trade_no'] ?? '') ?: null);
            return $this->ack($driver->failResponse(), false, Code::SIGN_INVALID);
        }

        $parsed   = $driver->parse($params);
        $paymentNo = $parsed['out_trade_no'];
        if ($paymentNo === '') {
            return $this->ack($driver->failResponse(), false, Code::PARAM_ERROR);
        }

        $payment = Payment::where('payment_no', $paymentNo)->find();
        if (!$payment) {
            return $this->ack($driver->failResponse(), false, Code::ORDER_NOT_FOUND);
        }

        // 归属校验:渠道 / 订单 / 商户必须自洽(防张冠李戴、跨商户)
        $order = Order::find($payment->order_id);
        if ((string) $payment->channel !== $channelCode
            || !$order
            || (int) $payment->merchant_id !== (int) $order->merchant_id) {
            return $this->ack($driver->failResponse(), false, Code::PAYMENT_OWNERSHIP);
        }

        // 交易未成功 → 不发货,确认收到即可
        if (!$parsed['success']) {
            return $this->ack($driver->successResponse(), false, Code::SUCCESS);
        }

        // 成功回调必须带渠道交易号(空 trade_no 无法作为 uniq 二级幂等去重,spec §10.2)
        if ($parsed['channel_trade_no'] === '') {
            return $this->ack($driver->failResponse(), false, Code::PARAM_ERROR);
        }

        // 仅支持 CNY(spec §10.4.2)
        if (($parsed['currency'] ?? 'CNY') !== 'CNY') {
            return $this->ack($driver->failResponse(), false, Code::AMOUNT_MISMATCH);
        }

        // 金额必须良构(防空/非数值被 bcmath 静默当 0)
        if (!preg_match('/^\d+(\.\d{1,2})?$/', $parsed['amount'])) {
            return $this->ack($driver->failResponse(), false, Code::AMOUNT_MISMATCH);
        }

        // (2) 防金额篡改:实付 == 订单金额,且不小于支付单金额
        if (Money::cmp($parsed['amount'], (string) $order->total_amount) !== 0
            || Money::cmp($parsed['amount'], (string) $payment->amount) < 0) {
            return $this->ack($driver->failResponse(), false, Code::AMOUNT_MISMATCH);
        }

        // (3) 幂等 + 发货 + 结算(订单行锁内,死锁有限重试;其余异常一律受控失败应答)
        $payload = json_encode($params, JSON_UNESCAPED_UNICODE);
        $attempt = 0;
        while (true) {
            try {
                return $this->settle((int) $payment->id, $parsed['channel_trade_no'], $parsed['amount'], (string) $payload, $driver);
            } catch (BizException $e) {
                // 发货并发冲突 → 失败应答促渠道重试(重试将命中幂等)
                return $this->ack($driver->failResponse(), false, $e->getBizCode());
            } catch (\think\db\exception\PDOException $e) {
                if ($this->isDeadlock($e) && ++$attempt < self::MAX_RETRY) {
                    usleep(10000 * $attempt);
                    continue;
                }
                // 非死锁 DB 异常(如唯一约束冲突)→ 受控失败应答,绝不裸抛 500(spec §10.4.7)
                Log::error('[notify] settle db error: ' . $e->getMessage());
                return $this->ack($driver->failResponse(), false, Code::SERVER_ERROR);
            } catch (\Throwable $e) {
                Log::error('[notify] settle error: ' . $e->getMessage());
                return $this->ack($driver->failResponse(), false, Code::SERVER_ERROR);
            }
        }
    }

    /**
     * 核心事务:订单行锁内重查状态 → 发货 → 结算。
     */
    private function settle(int $paymentId, string $channelTradeNo, string $paidAmount, string $payload, PayDriverInterface $driver): array
    {
        return Db::transaction(function () use ($paymentId, $channelTradeNo, $paidAmount, $payload, $driver) {
            $now     = date('Y-m-d H:i:s');
            $payment = Payment::find($paymentId);
            if (!$payment) {
                throw new BizException(Code::ORDER_NOT_FOUND, '支付单不存在');
            }
            $order = Order::find($payment->order_id);
            if (!$order) {
                throw new BizException(Code::ORDER_NOT_FOUND, '订单不存在');
            }

            // 锁顺序与下单/回收一致:先锁商品行(串行化闸门),再锁订单行
            $product = Product::where('id', $order->product_id)->lock(true)->find();
            $order = Order::where('id', $order->id)->lock(true)->find();
            $status = (int) $order->status;

            // 幂等:已支付/已发货 → 不重复发货,直接成功应答
            if ($status === Order::STATUS_PAID || $status === Order::STATUS_DELIVERED) {
                return $this->ack($driver->successResponse(), false, Code::DUPLICATE_NOTIFY);
            }

            // 超时已关闭却收到成功支付 → 转异常待人工,记 payment 成功,不发货,成功应答止重试
            if ($status === Order::STATUS_CLOSED) {
                $this->markPaymentSuccess($paymentId, $channelTradeNo, $paidAmount, $payload, $now);
                Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_EXCEPTION, 'paid_at' => $now, 'update_time' => $now]);
                $this->log('settle_exception', SystemLog::LEVEL_ERROR, '超时关闭订单收到成功支付,已收款不入账,转人工', [
                    'order_id' => (int) $order->id,
                    'amount'   => $paidAmount,
                    'reason'   => 'closed_then_paid',
                ], (string) $order->order_no);
                return $this->ack($driver->successResponse(), false, Code::ORDER_EXCEPTION);
            }

            // 其它非待支付态(已退款/异常)→ 不处理
            if ($status !== Order::STATUS_PENDING) {
                return $this->ack($driver->successResponse(), false, Code::STATE_INVALID);
            }

            // ====== status == 待支付:正常发货 ======
            $this->markPaymentSuccess($paymentId, $channelTradeNo, $paidAmount, $payload, $now);

            // 非卡密类(知识/资源/权益):无卡发货,内容 = 商品 delivery_message;结算照常。
            // 类型以订单快照 goods_type 为准(不依赖商品仍存在/未改)。
            if ((int) $order->goods_type !== Product::GOODS_TYPE_CARD) {
                $content = $product ? (string) $product->delivery_message : '';
                Db::name('orders')->where('id', $order->id)->update([
                    'status'            => Order::STATUS_DELIVERED,
                    'delivered_content' => $content,
                    'paid_at'           => $now,
                    'delivered_at'      => $now,
                    'update_time'       => $now,
                ]);
                $this->doSettle($order, $now);
                return $this->ack($driver->successResponse(), true, Code::SUCCESS);
            }

            $qty       = (int) $order->quantity;
            $lockedCnt = Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count();

            // 卡不足(被超时释放/作废)→ 转异常,结算照常(商户已收款),成功应答止重试,转人工补货
            if ($lockedCnt !== $qty) {
                Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_EXCEPTION, 'paid_at' => $now, 'update_time' => $now]);
                $this->doSettle($order, $now);
                $this->log('settle_exception', SystemLog::LEVEL_ERROR, '卡密不足无法发货,已收款已结算,转人工补货', [
                    'order_id'   => (int) $order->id,
                    'need'       => $qty,
                    'locked'     => $lockedCnt,
                    'reason'     => 'card_shortage',
                ], (string) $order->order_no);
                return $this->ack($driver->successResponse(), false, Code::ORDER_EXCEPTION);
            }

            // 发货数量守恒:锁定卡 1→2,affected 必须 == quantity,否则回滚整笔
            $affected = Db::name('cards')->where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)
                ->update(['status' => Card::STATUS_SOLD, 'sold_at' => $now, 'update_time' => $now]);
            if ($affected !== $qty) {
                throw new BizException(Code::STATE_INVALID, '发货并发冲突');
            }

            // 快照(发货真相源,显式有序避免依赖隐式排序)
            $secrets = Db::name('cards')->where('order_id', $order->id)->where('status', Card::STATUS_SOLD)
                ->order('id', 'asc')->column('secret');
            Db::name('orders')->where('id', $order->id)->update([
                'status'            => Order::STATUS_DELIVERED,
                'delivered_content' => implode("\n", $secrets),
                'paid_at'           => $now,
                'delivered_at'      => $now,
                'update_time'       => $now,
            ]);

            // 结算入账
            $this->doSettle($order, $now);

            return $this->ack($driver->successResponse(), true, Code::SUCCESS);
        });
    }

    private function markPaymentSuccess(int $paymentId, string $channelTradeNo, string $paidAmount, string $payload, string $now): void
    {
        Db::name('payments')->where('id', $paymentId)->where('status', '<>', Payment::STATUS_SUCCESS)
            ->update([
                'status'           => Payment::STATUS_SUCCESS,
                'channel_trade_no' => $channelTradeNo !== '' ? $channelTradeNo : null,
                'paid_amount'      => $paidAmount,
                'notify_payload'   => $payload,
                'notified_at'      => $now,
                'paid_at'          => $now,
                'update_time'      => $now,
            ]);
    }

    /**
     * 结算:商户余额 += 入账(net);记两条流水(订单收入 +total、平台佣金 -commission)。
     * 商户行 FOR UPDATE 防丢失更新;uniq(order_id,type) 兜底结算幂等。
     */
    private function doSettle(Order $order, string $now): void
    {
        $merchant = Merchant::where('id', $order->merchant_id)->lock(true)->find();

        $gross = (string) $order->total_amount;
        $calc  = (new SettlementService())->calc($gross, (string) $merchant->commission_rate);

        $afterIncome     = Money::add((string) $merchant->balance, $gross);
        $afterCommission = Money::sub($afterIncome, $calc['commission']); // = balance + income(net)

        Db::name('merchants')->where('id', $merchant->id)->update(['balance' => $afterCommission, 'update_time' => $now]);

        MerchantFundLog::create([
            'merchant_id' => $merchant->id, 'type' => MerchantFundLog::TYPE_INCOME,
            'amount' => $gross, 'balance_after' => $afterIncome, 'order_id' => $order->id,
            'remark' => '订单收入 ' . $order->order_no,
        ]);
        MerchantFundLog::create([
            'merchant_id' => $merchant->id, 'type' => MerchantFundLog::TYPE_COMMISSION,
            'amount' => '-' . $calc['commission'], 'balance_after' => $afterCommission, 'order_id' => $order->id,
            'remark' => '平台佣金',
        ]);
    }

    private function ack(string $ack, bool $delivered, int $code): array
    {
        return ['ack' => $ack, 'delivered' => $delivered, 'code' => $code];
    }

    /** 旁路记日志:整体 try/catch,任何异常吞掉,绝不影响回调主流程。 */
    private function log(string $type, string $level, string $message, array $context = [], ?string $orderNo = null): void
    {
        try {
            (new SystemLogService())->record($type, $level, $message, $context, $orderNo);
        } catch (\Throwable $e) {
            // 日志失败绝不拖垮回调
        }
    }

    private function isDeadlock(\Throwable $e): bool
    {
        $msg = $e->getMessage();
        return false !== stripos($msg, 'Deadlock found') || false !== stripos($msg, 'Lock wait timeout');
    }
}
