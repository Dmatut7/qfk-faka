<?php
declare(strict_types=1);

namespace app\controller\pay;

use app\BaseController;
use app\service\NotifyService;

/**
 * 支付异步回调入口(公开,安全完全依赖验签)。
 * 返回渠道要求的【纯文本】应答(如易支付 'success'),不是 JSON。
 */
class Notify extends BaseController
{
    public function index(NotifyService $svc, $channel)
    {
        // 仅取渠道发来的 get + post 参数;排除路由变量 channel,否则会污染验签
        $params = array_merge($this->request->get(), $this->request->post());
        $result = $svc->handle((string) $channel, $params);

        return $result['ack'];
    }
}
