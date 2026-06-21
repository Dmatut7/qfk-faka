<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantService;

/**
 * 商户后台:店铺装修(受 MerchantAuth 保护)。
 *
 * deposit / verified 由平台控制,商户不可修改。
 */
class Shop extends BaseApiController
{
    public function show(MerchantService $svc)
    {
        return $this->success($svc->getShop($this->authId()));
    }

    public function update(MerchantService $svc)
    {
        $d = $this->params(['logo', 'cover', 'intro', 'announcement', 'contact_qq', 'contact_wechat', 'contact_mobile']);
        return $this->success($svc->updateShop($this->authId(), $d));
    }
}
