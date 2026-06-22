<?php
declare(strict_types=1);

namespace app\controller\buyer;

use app\controller\BaseApiController;
use app\service\DownloadService;

/**
 * 买家前台:资源类下载防盗链。校验限时签名后 302 跳转真实下载地址(真实地址不直接暴露)。
 */
class Download extends BaseApiController
{
    public function go(DownloadService $svc, $orderNo)
    {
        $expires = (int) $this->input('expires', 0);
        $token   = (string) $this->input('token', '');
        $url     = $svc->resolve((string) $orderNo, $expires, $token); // 失败抛 BizException → 全局渲染
        return redirect($url);
    }
}
