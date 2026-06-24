<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\BuyerAccountService;

/**
 * 买家账号(可选):注册 / 登录 公开;me / orders 需 BuyerAuth。
 */
class Account extends BaseApiController
{
    public function register(BuyerAccountService $svc)
    {
        $d = $this->params(['email', 'password', 'contact']);
        $this->validate($d, ['email' => 'require', 'password' => 'require']);
        return $this->success($svc->register(
            (string) $d['email'],
            (string) $d['password'],
            isset($d['contact']) ? (string) $d['contact'] : ''
        ));
    }

    public function login(BuyerAccountService $svc)
    {
        $d = $this->params(['email', 'password']);
        $this->validate($d, ['email' => 'require', 'password' => 'require']);
        return $this->success($svc->login((string) $d['email'], (string) $d['password'], (string) $this->request->ip()));
    }

    /** 需 BuyerAuth */
    public function me()
    {
        return $this->success(['buyer' => $this->request->buyer->toArray()]);
    }

    /** 需 BuyerAuth:我的订单(按邮箱关联,含此前游客单) */
    public function orders(BuyerAccountService $svc)
    {
        $page = max(1, (int) $this->input('page', 1));
        $size = min(50, max(1, (int) $this->input('size', 20)));
        return $this->success($svc->listOrders($this->request->buyer, $page, $size));
    }
}
