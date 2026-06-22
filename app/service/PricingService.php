<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Product;
use app\util\Money;

/**
 * 结算计价:优惠券与订单级促销「互斥取最优」的共享计算,供下单(OrderService)与买家试算复用。
 * 纯计算 + 券有效性校验(findUsable),不消耗/核销任何资源。
 */
class PricingService
{
    /**
     * 取最优优惠。返回 ['discount'=>string,'label'=>string,'coupon_id'=>?int,'coupon_code'=>string]。
     * 券优惠 ≥ 促销优惠时用券(买家显式选择优先);券无效会抛出(由调用方决定是否容错)。
     */
    public function bestDiscount(int $merchantId, string $original, string $couponCode = ''): array
    {
        $couponDiscount = '0.00';
        $couponObj      = null;
        $code           = trim($couponCode);
        if ($code !== '') {
            $cs             = new CouponService();
            $couponObj      = $cs->findUsable($merchantId, $code, $original);
            $couponDiscount = $cs->computeDiscount($couponObj, $original);
        }

        $promo         = (new PromotionService())->bestPromotion($merchantId, $original);
        $promoDiscount = $promo ? $promo['discount'] : '0.00';

        if (Money::cmp($couponDiscount, '0') > 0 && Money::cmp($couponDiscount, $promoDiscount) >= 0) {
            return ['discount' => $couponDiscount, 'label' => '券:' . $couponObj->code, 'coupon_id' => (int) $couponObj->id, 'coupon_code' => $couponObj->code];
        }
        if (Money::cmp($promoDiscount, '0') > 0) {
            return ['discount' => $promoDiscount, 'label' => $promo['label'], 'coupon_id' => null, 'coupon_code' => ''];
        }
        return ['discount' => '0.00', 'label' => '', 'coupon_id' => null, 'coupon_code' => ''];
    }

    /**
     * 买家结算试算:按商品(含限时折扣价)与数量算原价,叠加最优优惠。
     * couponCode 为空时仅算自动促销;券无效则抛 BizException(前端可清券重试)。
     */
    public function previewForProduct(int $productId, int $quantity, string $couponCode = ''): array
    {
        $product = Product::find($productId);
        if (!$product) {
            throw new BizException(Code::NOT_FOUND, '商品不存在');
        }
        $qty      = max(1, $quantity);
        $original = Money::mul($product->effectivePrice(), (string) $qty);
        $b        = $this->bestDiscount((int) $product->merchant_id, $original, $couponCode);

        return [
            'original_amount' => $original,
            'discount'        => $b['discount'],
            'final_amount'    => Money::sub($original, $b['discount']),
            'discount_label'  => $b['label'],
            'coupon_applied'  => $b['coupon_id'] !== null,
        ];
    }
}
