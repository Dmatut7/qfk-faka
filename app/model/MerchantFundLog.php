<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户资金流水(只增不改的账本)。无 update_time。
 * 结算幂等由 NotifyService 的「订单行锁 + 锁内状态重查」保证(应用层);DB 层 uniq(order_id,type)
 * 已移除(退款会对同一订单再写一条 COMMISSION 回冲,与结算的 COMMISSION 冲突)。
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

    public const TYPE_INCOME     = 1; // 订单收入
    public const TYPE_COMMISSION = 2; // 平台佣金
    public const TYPE_WITHDRAW   = 3; // 提现
    public const TYPE_REFUND     = 4; // 退款
}
