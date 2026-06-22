<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\ArticleService;

/**
 * 平台后台:门户内容(资讯/常见问题/单页)管理(受 AdminAuth 保护)。
 */
class Articles extends BaseApiController
{
    public function index(ArticleService $svc)
    {
        $type = $this->input('type');
        $type = ($type === null || $type === '') ? null : (int) $type;
        return $this->success($svc->list($type));
    }

    public function create(ArticleService $svc)
    {
        $data = $this->params(['type', 'title', 'summary', 'category', 'content', 'status', 'sort']);
        $this->validate($data, [
            'title'   => 'require|max:200',
            'content' => 'require',
        ]);

        return $this->success($this->view($svc->create($data)));
    }

    public function update(ArticleService $svc, $id)
    {
        $data = $this->params(['type', 'title', 'summary', 'category', 'content', 'status', 'sort']);
        return $this->success($this->view($svc->update((int) $id, $data)));
    }

    public function delete(ArticleService $svc, $id)
    {
        $svc->delete((int) $id);
        return $this->success(['id' => (int) $id]);
    }

    private function view($a): array
    {
        return [
            'id'       => (int) $a->id,
            'type'     => (int) $a->type,
            'title'    => $a->title,
            'summary'  => (string) $a->summary,
            'category' => (string) $a->category,
            'status'   => (int) $a->status,
            'sort'     => (int) $a->sort,
            'views'    => (int) $a->views,
        ];
    }
}
