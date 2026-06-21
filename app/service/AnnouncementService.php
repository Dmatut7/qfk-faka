<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Announcement;

/**
 * 平台公告管理:列表、创建、修改、删除,以及店铺前台展示用查询。
 */
class AnnouncementService
{
    /** 后台列表:按 sort 倒序、id 倒序,返回全部状态。 */
    public function list(): array
    {
        $items = Announcement::order('sort', 'desc')->order('id', 'desc')
            ->select()
            ->toArray();

        return ['items' => $items];
    }

    /** 店铺前台展示用公告:仅 status=1,按 sort 倒序,最多若干条,字段精简。 */
    public function storeNotices(int $limit = Announcement::STORE_LIMIT): array
    {
        $rows = Announcement::where('status', Announcement::STATUS_SHOWN)
            ->order('sort', 'desc')->order('id', 'desc')
            ->limit($limit)
            ->field(['id', 'title', 'content', 'create_time'])
            ->select()
            ->toArray();

        return array_map(static function ($n) {
            return [
                'id'          => (int) $n['id'],
                'title'       => $n['title'],
                'content'     => $n['content'],
                'create_time' => $n['create_time'],
            ];
        }, $rows);
    }

    public function create(array $d): Announcement
    {
        $title   = trim((string) ($d['title'] ?? ''));
        $content = (string) ($d['content'] ?? '');

        if ($title === '') {
            throw new BizException(Code::PARAM_ERROR, '标题不能为空');
        }
        if ($content === '') {
            throw new BizException(Code::PARAM_ERROR, '内容不能为空');
        }

        return Announcement::create([
            'title'   => $title,
            'content' => $content,
            'status'  => $this->normalizeStatus($d['status'] ?? Announcement::STATUS_SHOWN),
            'sort'    => (int) ($d['sort'] ?? 0),
        ]);
    }

    public function update(int $id, array $d): Announcement
    {
        $a      = $this->find($id);
        $update = [];

        if (array_key_exists('title', $d) && trim((string) $d['title']) !== '') {
            $update['title'] = trim((string) $d['title']);
        }
        if (array_key_exists('content', $d) && (string) $d['content'] !== '') {
            $update['content'] = (string) $d['content'];
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
        $a = $this->find($id);
        $a->delete();
    }

    private function normalizeStatus($status): int
    {
        return (int) $status === Announcement::STATUS_SHOWN
            ? Announcement::STATUS_SHOWN
            : Announcement::STATUS_HIDDEN;
    }

    private function find(int $id): Announcement
    {
        $a = Announcement::find($id);
        if (!$a) {
            throw new BizException(Code::NOT_FOUND, '公告不存在');
        }
        return $a;
    }
}
