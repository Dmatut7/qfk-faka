<?php
declare(strict_types=1);

namespace app\model;

use app\util\Money;
use think\Model;

/**
 * 商品。price 以字符串保留 DECIMAL 精度;stock 仅作展示缓存,
 * 实际库存以 cards 加锁查询为准(spec §6 / §10.3)。
 */
class Product extends Model
{
    protected $name = 'products';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'type'        => 'integer',
        'goods_type'  => 'integer',
        'stock'       => 'integer',
        'low_stock_notified' => 'integer',
        'sales_count' => 'integer',
        'min_buy'     => 'integer',
        'max_buy'     => 'integer',
        'status'      => 'integer',
        'sort'        => 'integer',
        'show_stock_type' => 'integer',
    ];

    public const STATUS_OFF = 0; // 下架
    public const STATUS_ON  = 1; // 在售

    // 发货方式(与商品类型 goods_type 正交)
    public const TYPE_AUTO   = 1; // 自动发卡
    public const TYPE_MANUAL = 2; // 手动发货

    // 商品类型(对标鲸商城PRO 四类销售类型)
    public const GOODS_TYPE_CARD      = 1; // 卡密
    public const GOODS_TYPE_KNOWLEDGE = 2; // 知识(图文/章节)
    public const GOODS_TYPE_RESOURCE  = 3; // 资源(文件下载)
    public const GOODS_TYPE_RIGHTS    = 4; // 权益(会员/权益码)

    public const GOODS_TYPES = [
        self::GOODS_TYPE_CARD,
        self::GOODS_TYPE_KNOWLEDGE,
        self::GOODS_TYPE_RESOURCE,
        self::GOODS_TYPE_RIGHTS,
    ];

    public function isOnSale(): bool
    {
        return (int) $this->status === self::STATUS_ON;
    }

    /**
     * 限时折扣是否生效:设置了 discount_price 且 < price,且当前在 [start,end] 窗口内
     * (start 空=无下限,end 空=无上限)。
     */
    public function discountActive(?string $now = null): bool
    {
        if ($this->discount_price === null || $this->discount_price === '') {
            return false;
        }
        if (Money::cmp((string) $this->discount_price, (string) $this->price) >= 0) {
            return false; // 折扣价不低于原价 → 非折扣
        }
        $now = $now ?? date('Y-m-d H:i:s');
        if ($this->discount_start && $now < (string) $this->discount_start) {
            return false;
        }
        if ($this->discount_end && $now > (string) $this->discount_end) {
            return false;
        }
        return true;
    }

    /** 应收单价:限时折扣生效则取折扣价,否则原价。 */
    public function effectivePrice(?string $now = null): string
    {
        return $this->discountActive($now) ? (string) $this->discount_price : (string) $this->price;
    }

    /** 卡密类:走 cards 一卡一售行锁预占;其余类型走内容发货。 */
    public function isCardType(): bool
    {
        return (int) $this->goods_type === self::GOODS_TYPE_CARD;
    }

    /**
     * 是否走「码池」一物一售(行锁预占 + 唯一码发放):卡密(卡密)与权益(权益码)。
     * 知识/资源走内容发货(delivery_message),不占码池。
     */
    public function usesCardPool(): bool
    {
        return in_array((int) $this->goods_type, [self::GOODS_TYPE_CARD, self::GOODS_TYPE_RIGHTS], true);
    }

    /** 给定 goods_type 是否走码池(供订单按快照判定) */
    public static function goodsTypeUsesPool(int $goodsType): bool
    {
        return in_array($goodsType, [self::GOODS_TYPE_CARD, self::GOODS_TYPE_RIGHTS], true);
    }
}
