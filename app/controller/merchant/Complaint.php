<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\ComplaintService;

/**
 * 商户后台:投诉处理(受 MerchantAuth 保护,均限当前商户)。
 */
class Complaint extends BaseApiController
{
    public function index(ComplaintService $svc)
    {
        $status = $this->input('status');
        $status = ($status === null || $status === '') ? null : (int) $status;
        $page = max(1, (int) ($this->input('page') ?: 1));
        $res = $svc->merchantList($this->authId(), $status, $page);
        return $this->success(['items' => $res['items'], 'total' => $res['total'], 'page' => $res['page']]);
    }

    public function reply(ComplaintService $svc, $id)
    {
        $reply = (string) $this->input('reply', '');
        $c = $svc->merchantReply($this->authId(), (int) $id, $reply);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status]);
    }
}
