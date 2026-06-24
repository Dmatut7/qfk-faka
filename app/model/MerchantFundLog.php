<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户资金流水(只增不改的账本)。无 update_time。
 * 结算幂等由 NotifyService 的「订单行锁 + 锁内状态重查」保证(应用层);DB 层 uniq(order_id,type)
 * 为兜底(20260623040000 恢复)。退款佣金回冲用独立 type=5(REFUND_COMMISSION),与结算佣金
 * type=2 不在同一 (order_id,type),故不冲突,唯一索引可共存。
 * balance_after 语义:记「逻辑净头寸 balance-debt」(B1 负欠隔离),无负欠时即等于 merchants.balance。
 */
class MerchantFundLog extends Model
{
    protected $name = 'merchant_fund_logs';

    /** 账本只写不改,关闭 update_time */
    protected $updateTime = false;

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'type'        => 'integer',
    ];

    public const TYPE_INCOME            = 1; // 订单收入
    public const TYPE_COMMISSION        = 2; // 平台佣金(结算扣)
    public const TYPE_WITHDRAW          = 3; // 提现
    public const TYPE_REFUND            = 4; // 退款冲收入
    public const TYPE_REFUND_COMMISSION = 5; // 退款佣金回冲(独立 type,使 uniq(order_id,type) 在 settle/refund 间不冲突)
}
