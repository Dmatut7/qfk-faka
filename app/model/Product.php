<?php
declare(strict_types=1);

namespace app\model;

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
        'stock'       => 'integer',
        'sales_count' => 'integer',
        'min_buy'     => 'integer',
        'max_buy'     => 'integer',
        'status'      => 'integer',
        'sort'        => 'integer',
    ];

    public const STATUS_OFF = 0; // 下架
    public const STATUS_ON  = 1; // 在售

    public const TYPE_AUTO   = 1; // 自动发卡
    public const TYPE_MANUAL = 2; // 手动发货

    public function isOnSale(): bool
    {
        return (int) $this->status === self::STATUS_ON;
    }
}
