<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 商品分类(商户级)。
 */
class Category extends Model
{
    protected $name = 'categories';

    protected $type = [
        'id'          => 'integer',
        'merchant_id' => 'integer',
        'sort'        => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_HIDDEN = 0;
    public const STATUS_SHOWN  = 1;
}
