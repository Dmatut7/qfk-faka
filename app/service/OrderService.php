<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Card;
use app\model\Order;
use app\model\Product;
use app\util\Money;
use app\util\OrderNo;
use think\facade\Db;

/**
 * 下单服务 —— 并发安全的"一卡一售"预占(spec §5/§6/§10.3)。
 *
 * 核心保证:任意并发下一张卡至多归属一个订单、不超卖。
 * 机制:事务 + 锁顺序(products→cards→orders)+ FOR UPDATE SKIP LOCKED 取卡 +
 *       锁内二次 UPDATE 校验 affected_rows + stock 相对增减 + 死锁有限重试。
 */
class OrderService
{
    /** 未支付订单有效期(秒) */
    public const ORDER_TTL = 900; // 15 分钟

    private const MAX_DEADLOCK_RETRY = 3;

    public function create(array $input): Order
    {
        $productId = (int) ($input['product_id'] ?? 0);
        $quantity  = (int) ($input['quantity'] ?? 0);
        if ($productId <= 0 || $quantity <= 0) {
            throw new BizException(Code::PARAM_ERROR, '商品或数量参数错误');
        }
        if (trim((string) ($input['buyer_email'] ?? '')) === '') {
            throw new BizException(Code::PARAM_ERROR, '收货邮箱必填');
        }

        $attempt = 0;
        while (true) {
            try {
                return $this->reserve($productId, $quantity, $input);
            } catch (\think\db\exception\PDOException $e) {
                // 死锁/锁等待超时 → 有限次重试(spec §10.3.4)
                if ($this->isDeadlock($e) && ++$attempt < self::MAX_DEADLOCK_RETRY) {
                    usleep(10000 * $attempt);
                    continue;
                }
                throw $e;
            }
        }
    }

    /**
     * 单次预占(置于一个事务内)。
     */
    private function reserve(int $productId, int $quantity, array $input): Order
    {
        return Db::transaction(function () use ($productId, $quantity, $input) {
            $now = date('Y-m-d H:i:s');

            // 1) 锁商品行(锁顺序起点)
            $product = Product::where('id', $productId)->lock(true)->find();
            if (!$product) {
                throw new BizException(Code::NOT_FOUND, '商品不存在');
            }
            if ((int) $product->status !== Product::STATUS_ON) {
                throw new BizException(Code::PRODUCT_OFF, '商品已下架');
            }
            $min = max(1, (int) $product->min_buy);
            if ($quantity < $min) {
                throw new BizException(Code::BUY_LIMIT, "低于起购数量({$min})");
            }
            if ((int) $product->max_buy > 0 && $quantity > (int) $product->max_buy) {
                throw new BizException(Code::BUY_LIMIT, "超过单笔限购({$product->max_buy})");
            }

            // 2) 取可售卡:FOR UPDATE SKIP LOCKED(各并发请求拿到不同的卡)
            $cardIds = Db::name('cards')
                ->where('product_id', $productId)
                ->where('status', Card::STATUS_UNSOLD)
                ->order('id', 'asc')
                ->limit($quantity)
                ->lock('FOR UPDATE SKIP LOCKED')
                ->column('id');

            if (count($cardIds) < $quantity) {
                throw new BizException(Code::STOCK_NOT_ENOUGH, '库存不足');
            }

            // 3) 金额(bcmath,禁止浮点)
            $unitPrice = $product->price;
            $total     = Money::mul($unitPrice, (string) $quantity);

            // 4) 建订单
            $order = Order::create([
                'order_no'      => OrderNo::generate(),
                'merchant_id'   => $product->merchant_id,
                'product_id'    => $productId,
                'buyer_email'   => trim((string) $input['buyer_email']),
                'buyer_contact' => $input['buyer_contact'] ?? null,
                'quantity'      => $quantity,
                'unit_price'    => $unitPrice,
                'total_amount'  => $total,
                'status'        => Order::STATUS_PENDING,
                'client_ip'     => $input['client_ip'] ?? null,
                'expire_at'     => date('Y-m-d H:i:s', time() + self::ORDER_TTL),
            ]);

            // 5) 锁定卡并二次校验:affected_rows 必须等于数量,否则回滚整笔
            $affected = Db::name('cards')
                ->whereIn('id', $cardIds)
                ->where('status', Card::STATUS_UNSOLD)
                ->update([
                    'status'      => Card::STATUS_LOCKED,
                    'order_id'    => $order->id,
                    'locked_at'   => $now,
                    'update_time' => $now,
                ]);

            if ($affected !== $quantity) {
                throw new BizException(Code::STOCK_NOT_ENOUGH, '库存并发冲突,请重试');
            }

            // 6) stock 缓存相对递减(下限 0;真实库存以 cards 为准)
            Db::name('products')->where('id', $productId)
                ->update(['stock' => Db::raw("GREATEST(stock - {$quantity}, 0)"), 'update_time' => $now]);

            return $order;
        });
    }

    /**
     * 回收过期未支付订单:关单 + 释放锁定卡 + 回补库存。返回成功回收单数。
     * 每单独立事务 + 行锁 + 状态重查 → 幂等、可与并发安全共存(spec §10.3.6)。
     */
    public function reclaimExpired(int $limit = 100): int
    {
        $orderIds = Order::where('status', Order::STATUS_PENDING)
            ->where('expire_at', '<', date('Y-m-d H:i:s'))
            ->limit($limit)
            ->order('id', 'asc')
            ->column('id');

        $count = 0;
        foreach ($orderIds as $orderId) {
            $attempt = 0;
            while (true) {
                try {
                    if ($this->reclaimOne((int) $orderId)) {
                        $count++;
                    }
                    break;
                } catch (\think\db\exception\PDOException $e) {
                    if ($this->isDeadlock($e) && ++$attempt < self::MAX_DEADLOCK_RETRY) {
                        usleep(10000 * $attempt);
                        continue;
                    }
                    throw $e;
                }
            }
        }
        return $count;
    }

    private function reclaimOne(int $orderId): bool
    {
        return Db::transaction(function () use ($orderId) {
            $now = date('Y-m-d H:i:s');

            $order = Order::find($orderId);
            if (!$order || (int) $order->status !== Order::STATUS_PENDING) {
                return false;
            }

            // 锁顺序与下单一致:先锁商品行,再锁订单行
            Product::where('id', $order->product_id)->lock(true)->find();
            $locked = Order::where('id', $orderId)->lock(true)->find();

            // 锁内重查:已支付/已发货/已关闭 → 跳过(幂等)
            if (!$locked || (int) $locked->status !== Order::STATUS_PENDING) {
                return false;
            }
            if (strtotime($locked->expire_at) >= time()) {
                return false; // 已不再过期
            }

            // 关单(affected_rows 守卫)
            $closed = Db::name('orders')->where('id', $orderId)->where('status', Order::STATUS_PENDING)
                ->update(['status' => Order::STATUS_CLOSED, 'update_time' => $now]);
            if ($closed !== 1) {
                return false;
            }

            // 仅释放本单"锁定中(1)"的卡;已售(2)/已作废不动
            $released = Db::name('cards')
                ->where('order_id', $orderId)->where('status', Card::STATUS_LOCKED)
                ->update(['status' => Card::STATUS_UNSOLD, 'order_id' => null, 'locked_at' => null, 'update_time' => $now]);

            if ($released > 0) {
                Db::name('products')->where('id', $order->product_id)->inc('stock', $released)->update();
            }

            return true;
        });
    }

    private function isDeadlock(\Throwable $e): bool
    {
        $msg = $e->getMessage();
        return false !== strpos($msg, 'Deadlock')
            || false !== strpos($msg, '1213')
            || false !== strpos($msg, 'Lock wait timeout')
            || false !== strpos($msg, '1205');
    }
}
