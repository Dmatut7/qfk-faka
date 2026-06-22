<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\CouponService;
use app\service\PricingService;

/**
 * 买家前台:下单前计价试算(公开)。不核销,仅返回试算金额。
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

    /**
     * 结算试算:原价(含限时折扣)+ 最优优惠(券与满减满折互斥取最优)+ 应付。
     * coupon_code 选填;券无效会报错(前端清券后再试)。
     */
    public function preview(PricingService $svc)
    {
        $d = $this->params(['product_id', 'quantity', 'coupon_code']);
        $this->validate($d, [
            'product_id' => 'require|integer',
            'quantity'   => 'integer|egt:1',
        ]);
        return $this->success($svc->previewForProduct(
            (int) $d['product_id'],
            (int) ($d['quantity'] ?? 1),
            (string) ($d['coupon_code'] ?? '')
        ));
    }
}
