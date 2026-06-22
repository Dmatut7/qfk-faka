<?php
declare(strict_types=1);

namespace app\controller\index;

use app\controller\BaseApiController;
use app\service\ForbiddenItemService;

/**
 * 门户公开:禁售目录(无鉴权,按类目分组)。
 */
class Forbidden extends BaseApiController
{
    public function index(ForbiddenItemService $svc)
    {
        return $this->success(['groups' => $svc->publicGrouped()]);
    }
}
