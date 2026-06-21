<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\CardService;

/**
 * 商户后台:卡密管理(受 MerchantAuth 保护)。
 */
class Card extends BaseApiController
{
    public function import(CardService $svc)
    {
        $d = $this->params(['product_id', 'cards', 'batch_no']);
        $this->validate($d, [
            'product_id' => 'require|integer',
            'cards'      => 'require',
        ], [
            'cards.require' => '卡密内容必填',
        ]);
        return $this->success($svc->import($this->authId(), (int) $d['product_id'], (string) $d['cards'], $d['batch_no'] ?? null));
    }

    public function index(CardService $svc, $productId)
    {
        $filter = $this->params(['status']);
        $page   = (int) $this->input('page', 1);
        return $this->success($svc->list($this->authId(), (int) $productId, $filter, $page));
    }

    public function stats(CardService $svc, $productId)
    {
        return $this->success($svc->stats($this->authId(), (int) $productId));
    }

    public function disable(CardService $svc, $id)
    {
        $svc->disable($this->authId(), (int) $id);
        return $this->success();
    }

    public function delete(CardService $svc, $id)
    {
        $svc->deleteUnsold($this->authId(), (int) $id);
        return $this->success();
    }
}
