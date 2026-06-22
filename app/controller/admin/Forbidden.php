<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\ForbiddenItemService;

/**
 * 平台后台:禁售目录管理(受 AdminAuth 保护)。
 */
class Forbidden extends BaseApiController
{
    public function index(ForbiddenItemService $svc)
    {
        return $this->success(['items' => $svc->list()]);
    }

    public function create(ForbiddenItemService $svc)
    {
        $d = $this->params(['category', 'title', 'description', 'sort', 'status']);
        $this->validate($d, ['title' => 'require|max:200']);
        $f = $svc->create($d);
        return $this->success(['id' => (int) $f->id]);
    }

    public function update(ForbiddenItemService $svc, $id)
    {
        $d = $this->params(['category', 'title', 'description', 'sort', 'status']);
        $svc->update((int) $id, $d);
        return $this->success(['id' => (int) $id]);
    }

    public function delete(ForbiddenItemService $svc, $id)
    {
        $svc->delete((int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
