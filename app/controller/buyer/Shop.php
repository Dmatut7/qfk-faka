<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\StorefrontService;

/**
 * 买家前台:商店与商品浏览(公开)。
 */
class Shop extends BaseApiController
{
    public function store(StorefrontService $svc, $slug)
    {
        return $this->success($svc->store((string) $slug));
    }

    public function product(StorefrontService $svc, $id)
    {
        return $this->success($svc->product((int) $id));
    }
}
