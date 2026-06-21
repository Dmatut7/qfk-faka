<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AnnouncementService;

/**
 * 平台后台:公告管理(受 AdminAuth 保护)。
 */
class Announcements extends BaseApiController
{
    public function index(AnnouncementService $svc)
    {
        return $this->success($svc->list());
    }

    public function create(AnnouncementService $svc)
    {
        $data = $this->params(['title', 'content', 'status', 'sort']);
        $this->validate($data, [
            'title'   => 'require|max:200',
            'content' => 'require',
        ]);

        $a = $svc->create($data);

        return $this->success([
            'id'     => (int) $a->id,
            'title'  => $a->title,
            'status' => (int) $a->status,
            'sort'   => (int) $a->sort,
        ]);
    }

    public function update(AnnouncementService $svc, $id)
    {
        $data = $this->params(['title', 'content', 'status', 'sort']);
        $a    = $svc->update((int) $id, $data);

        return $this->success([
            'id'     => (int) $a->id,
            'title'  => $a->title,
            'status' => (int) $a->status,
            'sort'   => (int) $a->sort,
        ]);
    }

    public function delete(AnnouncementService $svc, $id)
    {
        $svc->delete((int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
