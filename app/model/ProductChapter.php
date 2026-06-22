<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 知识类商品章节。status=1 上架;按 sort 升序、id 升序展示。
 */
class ProductChapter extends Model
{
    protected $name = 'product_chapters';

    protected $type = [
        'id'          => 'integer',
        'product_id'  => 'integer',
        'merchant_id' => 'integer',
        'sort'        => 'integer',
        'status'      => 'integer',
    ];

    public const STATUS_OFF = 0;
    public const STATUS_ON  = 1;
}
