<?php
declare(strict_types=1);

namespace app\controller\index;

use app\controller\BaseApiController;
use app\model\Article;
use app\service\ArticleService;

/**
 * 门户公开内容接口(无鉴权):资讯/常见问题/单页 的列表与详情。
 * 仅返回已发布内容;详情访问会自增浏览量。
 */
class Articles extends BaseApiController
{
    public function list(ArticleService $svc)
    {
        $type = (int) $this->input('type', Article::TYPE_NEWS);
        if (!in_array($type, Article::TYPES, true)) {
            $type = Article::TYPE_NEWS;
        }
        $category = trim((string) $this->input('category', ''));
        $limit    = (int) $this->input('limit', 50);
        $limit    = ($limit > 0 && $limit <= 100) ? $limit : 50;

        return $this->success([
            'items' => $svc->published($type, $category !== '' ? $category : null, $limit),
        ]);
    }

    public function detail(ArticleService $svc, $id)
    {
        return $this->success($svc->detail((int) $id));
    }
}
