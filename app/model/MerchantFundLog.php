<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商户资金流水(只增不改的账本)。无 update_time。
 * uniq(order_id,type) 保证同一订单同类型至多一条(结算幂等)。
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
