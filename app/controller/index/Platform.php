<?php
declare(strict_types=1);

namespace app\controller\index;

use app\controller\BaseApiController;
use app\model\Merchant;
use app\model\Order;
use app\model\Product;

/**
 * 门户公开:平台聚合统计(无鉴权,仅非敏感计数,用于门户首页信任展示)。
 */
class Platform extends BaseApiController
{
    public function stats()
    {
        return $this->success([
            'merchants' => Merchant::where('status', Merchant::STATUS_ACTIVE)->count(),
            'products'  => Product::where('status', Product::STATUS_ON)->count(),
            'orders'    => Order::where('status', Order::STATUS_DELIVERED)->count(),
        ]);
    }
}
