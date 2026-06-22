<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\BuyerBlacklistService;

/**
 * 平台后台:买家黑名单(受 AdminAuth 保护)。按邮箱拦截下单。
 */
class Blacklist extends BaseApiController
{
    public function index(BuyerBlacklistService $svc)
    {
        return $this->success(['items' => $svc->list((string) $this->input('keyword', ''))]);
    }

    public function add(BuyerBlacklistService $svc)
    {
        $d = $this->params(['email', 'reason']);
        $this->validate($d, ['email' => 'require|email']);
        $b = $svc->add((string) $d['email'], (string) ($d['reason'] ?? ''));
        return $this->success(['id' => (int) $b->id, 'email' => $b->email, 'status' => (int) $b->status]);
    }

    public function remove(BuyerBlacklistService $svc, $id)
    {
        $svc->remove((int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
