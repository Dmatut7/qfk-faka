<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Article;

/**
 * 门户内容(资讯/FAQ/单页)管理:后台 CRUD + 门户公开查询(列表/详情)。
 */
class ArticleService
{
    /** 后台列表:可按 type 过滤,返回全部状态,按 sort 倒序、id 倒序。 */
    public function list(?int $type = null): array
    {
        $q = Article::order('sort', 'desc')->order('id', 'desc');
        if ($type !== null && in_array($type, Article::TYPES, true)) {
            $q->where('type', $type);
        }
        return ['items' => $q->select()->toArray()];
    }

    /** 门户公开列表:仅发布,按 type/可选 category 过滤,精简字段(不含正文)。 */
    public function published(int $type, ?string $category = null, int $limit = 50): array
    {
        $q = Article::where('status', Article::STATUS_PUBLISHED)->where('type', $type);
        if ($category !== null && $category !== '') {
            $q->where('category', $category);
        }
        $rows = $q->order('sort', 'desc')->order('id', 'desc')
            ->limit($limit)
            ->field(['id', 'type', 'title', 'summary', 'category', 'views', 'create_time'])
            ->select()->toArray();

        return array_map([$this, 'formatListItem'], $rows);
    }

    /** 门户详情:仅发布可见;浏览量原子 +1;返回完整正文。 */
    public function detail(int $id): array
    {
        $a = Article::where('status', Article::STATUS_PUBLISHED)->find($id);
        if (!$a) {
            throw new BizException(Code::NOT_FOUND, '内容不存在或未发布');
        }
        Article::where('id', $id)->inc('views')->update();
        return [
            'id'          => (int) $a->id,
            'type'        => (int) $a->type,
            'title'       => $a->title,
            'summary'     => (string) $a->summary,
            'category'    => (string) $a->category,
            'content'     => (string) $a->content,
            'views'       => (int) $a->views + 1,
            'create_time' => $a->create_time,
        ];
    }

    public function create(array $d): Article
    {
        $title   = trim((string) ($d['title'] ?? ''));
        $content = (string) ($d['content'] ?? '');
        if ($title === '') {
            throw new BizException(Code::PARAM_ERROR, '标题不能为空');
        }
        if ($content === '') {
            throw new BizException(Code::PARAM_ERROR, '内容不能为空');
        }
        return Article::create([
            'type'     => $this->normalizeType($d['type'] ?? Article::TYPE_NEWS),
            'title'    => $title,
            'summary'  => trim((string) ($d['summary'] ?? '')),
            'category' => trim((string) ($d['category'] ?? '')),
            'content'  => $content,
            'status'   => $this->normalizeStatus($d['status'] ?? Article::STATUS_PUBLISHED),
            'sort'     => (int) ($d['sort'] ?? 0),
        ]);
    }

    public function update(int $id, array $d): Article
    {
        $a      = $this->find($id);
        $update = [];

        if (array_key_exists('type', $d) && $d['type'] !== '' && $d['type'] !== null) {
            $update['type'] = $this->normalizeType($d['type']);
        }
        if (array_key_exists('title', $d)) {
            $title = trim((string) $d['title']);
            if ($title === '') {
                throw new BizException(Code::PARAM_ERROR, '标题不能为空');
            }
            $update['title'] = $title;
        }
        if (array_key_exists('summary', $d)) {
            $update['summary'] = trim((string) $d['summary']);
        }
        if (array_key_exists('category', $d)) {
            $update['category'] = trim((string) $d['category']);
        }
        if (array_key_exists('content', $d)) {
            $content = (string) $d['content'];
            if ($content === '') {
                throw new BizException(Code::PARAM_ERROR, '内容不能为空');
            }
            $update['content'] = $content;
        }
        if (array_key_exists('status', $d) && $d['status'] !== '' && $d['status'] !== null) {
            $update['status'] = $this->normalizeStatus($d['status']);
        }
        if (array_key_exists('sort', $d) && $d['sort'] !== '' && $d['sort'] !== null) {
            $update['sort'] = (int) $d['sort'];
        }

        if ($update) {
            $a->save($update);
        }
        return $a;
    }

    public function delete(int $id): void
    {
        $this->find($id)->delete();
    }

    private function formatListItem(array $n): array
    {
        return [
            'id'          => (int) $n['id'],
            'type'        => (int) $n['type'],
            'title'       => $n['title'],
            'summary'     => (string) $n['summary'],
            'category'    => (string) $n['category'],
            'views'       => (int) $n['views'],
            'create_time' => $n['create_time'],
        ];
    }

    private function normalizeType($type): int
    {
        $t = (int) $type;
        return in_array($t, Article::TYPES, true) ? $t : Article::TYPE_NEWS;
    }

    private function normalizeStatus($status): int
    {
        return (int) $status === Article::STATUS_PUBLISHED
            ? Article::STATUS_PUBLISHED
            : Article::STATUS_DRAFT;
    }

    private function find(int $id): Article
    {
        $a = Article::find($id);
        if (!$a) {
            throw new BizException(Code::NOT_FOUND, '内容不存在');
        }
        return $a;
    }
}
