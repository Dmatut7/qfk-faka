<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\CouponService;

/**
 * 买家前台:下单前优惠券计价校验(公开)。不核销,仅返回试算金额。
 */
class Coupon extends BaseApiController
{
    public function validateCode(CouponService $svc)
    {
        $d = $this->params(['code', 'product_id', 'quantity']);
        $this->validate($d, [
            'code'       => 'require',
            'product_id' => 'require|integer',
            'quantity'   => 'integer|egt:1',
        ]);
        return $this->success($svc->validateForProduct(
            (int) $d['product_id'],
            (int) ($d['quantity'] ?? 1),
            (string) $d['code']
        ));
    }
}
