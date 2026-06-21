<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\common\BizException;
use app\common\Code;
use app\controller\BaseApiController;
use app\service\MerchantOrderService;
use app\service\OrderService;

/**
 * 商户后台:订单列表/详情/手动关闭/补发(受 MerchantAuth 保护)。
 */
class Order extends BaseApiController
{
    public function index(MerchantOrderService $svc)
    {
        $filter = $this->params(['status', 'order_no', 'buyer_email']);
        $page   = (int) $this->input('page', 1);
        return $this->success($svc->list($this->authId(), $filter, $page));
    }

    public function detail(MerchantOrderService $svc, $id)
    {
        return $this->success($svc->detail($this->authId(), (int) $id));
    }

    public function close(MerchantOrderService $mos, OrderService $os, $id)
    {
        $mos->findOwned($this->authId(), (int) $id); // 归属校验
        if (!$os->cancelPending((int) $id)) {
            throw new BizException(Code::STATE_INVALID, '仅待支付订单可关闭');
        }
        return $this->success();
    }

    public function redeliver(MerchantOrderService $mos, OrderService $os, $id)
    {
        $mos->findOwned($this->authId(), (int) $id); // 归属校验
        $os->deliverManually((int) $id);
        return $this->success();
    }
}
