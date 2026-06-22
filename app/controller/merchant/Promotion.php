<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\PromotionService;

/**
 * 商户后台:订单级促销(满减/满折)管理(受 MerchantAuth 保护,均限当前商户)。
 */
class Promotion extends BaseApiController
{
    public function index(PromotionService $svc)
    {
        return $this->success(['items' => $svc->list($this->authId())]);
    }

    public function create(PromotionService $svc)
    {
        $d = $this->params(['name', 'type', 'threshold', 'value', 'status', 'start_at', 'end_at']);
        $this->validate($d, [
            'threshold' => 'require|float|egt:0',
            'value'     => 'require|float|gt:0',
        ]);
        return $this->success($svc->create($this->authId(), $d)->toArray());
    }

    public function update(PromotionService $svc, $id)
    {
        $d = $this->params(['name', 'type', 'threshold', 'value', 'status', 'start_at', 'end_at']);
        return $this->success($svc->update($this->authId(), (int) $id, $d)->toArray());
    }

    public function delete(PromotionService $svc, $id)
    {
        $svc->delete($this->authId(), (int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
