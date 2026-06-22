<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\ComplaintService;

/**
 * 买家前台:订单投诉(公开,以 order_no + 邮箱核验归属)。
 */
class Complaint extends BaseApiController
{
    public function create(ComplaintService $svc)
    {
        $d = $this->params(['order_no', 'email', 'type', 'description']);
        $this->validate($d, [
            'order_no'    => 'require',
            'email'       => 'require|email',
            'description' => 'require|max:1000',
        ]);
        $c = $svc->file((string) $d['order_no'], (string) $d['email'], (int) ($d['type'] ?? 4), (string) $d['description']);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status]);
    }

    public function query(ComplaintService $svc)
    {
        $d = $this->params(['order_no', 'email']);
        $this->validate($d, ['order_no' => 'require', 'email' => 'require|email']);
        return $this->success(['items' => $svc->listByOrder((string) $d['order_no'], (string) $d['email'])]);
    }

    public function escalate(ComplaintService $svc, $id)
    {
        $d = $this->params(['order_no', 'email']);
        $this->validate($d, ['order_no' => 'require', 'email' => 'require|email']);
        $c = $svc->escalate((string) $d['order_no'], (string) $d['email'], (int) $id);
        return $this->success(['id' => (int) $c->id, 'status' => (int) $c->status]);
    }
}
