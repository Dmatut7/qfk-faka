<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\CouponService;

/**
 * 商户后台:优惠券管理(受 MerchantAuth 保护,均限当前商户)。
 */
class Coupon extends BaseApiController
{
    public function index(CouponService $svc)
    {
        return $this->success($svc->list($this->authId()));
    }

    public function create(CouponService $svc)
    {
        $d = $this->params(['code', 'name', 'type', 'value', 'min_amount', 'max_discount', 'total', 'valid_from', 'valid_to', 'status']);
        $this->validate($d, [
            'code'  => 'require|max:32',
            'value' => 'require|float|egt:0',
        ], ['code.require' => '券码必填']);
        return $this->success($svc->create($this->authId(), $d)->toArray());
    }

    public function update(CouponService $svc, $id)
    {
        $d = $this->params(['name', 'type', 'value', 'min_amount', 'max_discount', 'total', 'valid_from', 'valid_to', 'status']);
        return $this->success($svc->update($this->authId(), (int) $id, $d)->toArray());
    }

    public function delete(CouponService $svc, $id)
    {
        $svc->delete($this->authId(), (int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
