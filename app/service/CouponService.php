<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Coupon;
use app\model\Order;
use app\model\Product;
use app\util\Money;

/**
 * 优惠券:商户 CRUD + 计价校验(满减/折扣/封顶/防0元/有效期/库存)。
 * 金额一律 bcmath(Money),禁止浮点。核销/下单应用见增量2。
 */
class CouponService
{
    private const EDITABLE = ['name', 'type', 'value', 'min_amount', 'max_discount', 'total', 'valid_from', 'valid_to', 'status'];

    public function list(int $merchantId): array
    {
        return Coupon::where('merchant_id', $merchantId)
            ->order('id', 'desc')->select()->toArray();
    }

    public function create(int $merchantId, array $d): Coupon
    {
        $code = trim((string) ($d['code'] ?? ''));
        if ($code === '') {
            throw new BizException(Code::PARAM_ERROR, '券码必填');
        }
        if (Coupon::where('merchant_id', $merchantId)->where('code', $code)->find()) {
            throw new BizException(Code::PARAM_ERROR, '券码已存在');
        }
        $type  = $this->normalizeType($d['type'] ?? Coupon::TYPE_AMOUNT);
        $value = $this->money($d['value'] ?? '0');
        $this->validateValueByType($type, $value);
        return Coupon::create([
            'merchant_id'  => $merchantId,
            'code'         => $code,
            'name'         => trim((string) ($d['name'] ?? '')),
            'type'         => $type,
            'value'        => $value,
            'min_amount'   => $this->money($d['min_amount'] ?? '0'),
            'max_discount' => $this->money($d['max_discount'] ?? '0'),
            'total'        => max(0, (int) ($d['total'] ?? 0)),
            'used'         => 0,
            'valid_from'   => !empty($d['valid_from']) ? $d['valid_from'] : null,
            'valid_to'     => !empty($d['valid_to']) ? $d['valid_to'] : null,
            'status'       => isset($d['status']) ? ((int) $d['status'] === 0 ? Coupon::STATUS_OFF : Coupon::STATUS_ON) : Coupon::STATUS_ON,
        ]);
    }

    public function update(int $merchantId, int $id, array $d): Coupon
    {
        $c = $this->findOwned($merchantId, $id);
        $patch = array_intersect_key($d, array_flip(self::EDITABLE));
        foreach (['value', 'min_amount', 'max_discount'] as $k) {
            if (array_key_exists($k, $patch)) {
                $patch[$k] = $this->money($patch[$k]);
            }
        }
        if (array_key_exists('type', $patch)) {
            $patch['type'] = $this->normalizeType($patch['type']);
        }
        if (array_key_exists('total', $patch)) {
            $patch['total'] = max(0, (int) $patch['total']);
        }
        if (array_key_exists('status', $patch)) {
            $patch['status'] = (int) $patch['status'] === 0 ? Coupon::STATUS_OFF : Coupon::STATUS_ON;
        }
        foreach (['valid_from', 'valid_to'] as $k) {
            if (array_key_exists($k, $patch) && empty($patch[$k])) {
                $patch[$k] = null;
            }
        }
        // 以补丁后的有效 type+value 复核边界(单改 value 或单改 type 都要校验)
        if (array_key_exists('type', $patch) || array_key_exists('value', $patch)) {
            $effType  = array_key_exists('type', $patch) ? (int) $patch['type'] : (int) $c->type;
            $effValue = array_key_exists('value', $patch) ? (string) $patch['value'] : (string) $c->value;
            $this->validateValueByType($effType, $effValue);
        }
        if ($patch) {
            $c->save($patch);
        }
        return $c;
    }

    /** 折扣券 value∈(0,100)(90=九折);满减券 value>0。防 value=0/100 算出近乎0元或无效单。 */
    private function validateValueByType(int $type, string $value): void
    {
        if ($type === Coupon::TYPE_PERCENT) {
            if (Money::cmp($value, '0') <= 0 || Money::cmp($value, '100') >= 0) {
                throw new BizException(Code::PARAM_ERROR, '折扣百分比须在 1~99 之间(如 90 表示九折)');
            }
        } else {
            if (Money::cmp($value, '0') <= 0) {
                throw new BizException(Code::PARAM_ERROR, '满减金额须大于 0');
            }
        }
    }

    public function delete(int $merchantId, int $id): void
    {
        $coupon = $this->findOwned($merchantId, $id);
        // M1:有待支付订单占用该券额时禁止硬删——否则关单 dec('used') 找不到券行(静默失效),
        // 且产生悬挂 coupon_id。请改为停用(status=OFF)。
        if (Order::where('coupon_id', $coupon->id)->where('status', Order::STATUS_PENDING)->find()) {
            throw new BizException(Code::STATE_INVALID, '该券有进行中的订单占用,暂不能删除,请先停用');
        }
        $coupon->delete();
    }

    /**
     * 买家计价校验:按商品定位商户与订单额,校验券并算优惠。
     * @return array{coupon_id:int, code:string, original_amount:string, discount:string, final_amount:string}
     */
    public function validateForProduct(int $productId, int $quantity, string $code): array
    {
        $product = Product::find($productId);
        if (!$product) {
            throw new BizException(Code::NOT_FOUND, '商品不存在');
        }
        $qty         = max(1, $quantity);
        // 用应收单价(含限时折扣),与 PricingService/OrderService 口径一致
        $orderAmount = Money::mul($product->effectivePrice(), (string) $qty);

        $coupon   = $this->findUsable((int) $product->merchant_id, $code, $orderAmount);
        $discount = $this->computeDiscount($coupon, $orderAmount);

        return [
            'coupon_id'       => (int) $coupon->id,
            'code'            => $coupon->code,
            'original_amount' => $orderAmount,
            'discount'        => $discount,
            'final_amount'    => Money::sub($orderAmount, $discount),
        ];
    }

    /**
     * 定位可用券:商户+code,须启用、在有效期、未售罄、达门槛。任何不满足抛 PARAM_ERROR。
     * 作用域严格限本商户(他人券对本店订单不可用)。
     */
    public function findUsable(int $merchantId, string $code, string $orderAmount): Coupon
    {
        $code   = trim($code);
        $coupon = Coupon::where('merchant_id', $merchantId)->where('code', $code)->find();
        if (!$coupon) {
            throw new BizException(Code::PARAM_ERROR, '优惠券不存在');
        }
        if (!$coupon->isEnabled()) {
            throw new BizException(Code::PARAM_ERROR, '优惠券已停用');
        }
        $now = date('Y-m-d H:i:s');
        if ($coupon->valid_from && $now < (string) $coupon->valid_from) {
            throw new BizException(Code::PARAM_ERROR, '优惠券未到生效时间');
        }
        if ($coupon->valid_to && $now > (string) $coupon->valid_to) {
            throw new BizException(Code::PARAM_ERROR, '优惠券已过期');
        }
        if ((int) $coupon->total > 0 && (int) $coupon->used >= (int) $coupon->total) {
            throw new BizException(Code::PARAM_ERROR, '优惠券已领完');
        }
        if (Money::cmp($orderAmount, (string) $coupon->min_amount) < 0) {
            throw new BizException(Code::PARAM_ERROR, '订单未达使用门槛(满 ' . Money::add((string) $coupon->min_amount, '0') . ' 可用)');
        }
        return $coupon;
    }

    /**
     * 计算优惠额(bcmath)。折扣 value=90 表示九折(应付=订单×0.90)。
     * 折扣可被 max_discount 封顶;最终优惠不超过 订单额-0.01(防 0 元单),且非负。
     */
    public function computeDiscount(Coupon $coupon, string $orderAmount): string
    {
        if ((int) $coupon->type === Coupon::TYPE_PERCENT) {
            $rate     = Money::mul((string) $coupon->value, '0.01'); // 90 → 0.90
            $pay      = Money::mul($orderAmount, $rate);
            $discount = Money::sub($orderAmount, $pay);
            if (Money::cmp((string) $coupon->max_discount, '0') > 0
                && Money::cmp($discount, (string) $coupon->max_discount) > 0) {
                $discount = Money::add((string) $coupon->max_discount, '0');
            }
        } else {
            $discount = Money::add((string) $coupon->value, '0');
        }

        // 防 0 元单:优惠最多 订单额-0.01;且非负
        $maxAllowed = Money::sub($orderAmount, '0.01');
        if (Money::cmp($maxAllowed, '0') < 0) {
            $maxAllowed = '0.00';
        }
        if (Money::cmp($discount, $maxAllowed) > 0) {
            $discount = $maxAllowed;
        }
        if (Money::cmp($discount, '0') < 0) {
            $discount = '0.00';
        }
        return $discount;
    }

    private function money($v): string
    {
        return Money::add((string) $v, '0');
    }

    private function normalizeType($type): int
    {
        $t = (int) $type;
        return in_array($t, Coupon::TYPES, true) ? $t : Coupon::TYPE_AMOUNT;
    }

    private function findOwned(int $merchantId, int $id): Coupon
    {
        $c = Coupon::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '优惠券不存在');
        }
        if ((int) $c->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        return $c;
    }
}
