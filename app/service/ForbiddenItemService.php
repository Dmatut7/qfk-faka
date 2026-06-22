<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\ForbiddenItem;

/**
 * 平台禁售目录:后台 CRUD + 门户公开(按类目分组)。
 */
class ForbiddenItemService
{
    /** 后台列表:全部状态,按 sort 倒序、id 倒序。 */
    public function list(): array
    {
        return ForbiddenItem::order('sort', 'desc')->order('id', 'desc')->select()->toArray();
    }

    /** 门户公开:仅展示项,按类目分组 [{category, items:[{title,description}]}]。 */
    public function publicGrouped(): array
    {
        $rows = ForbiddenItem::where('status', ForbiddenItem::STATUS_SHOWN)
            ->order('sort', 'desc')->order('id', 'desc')
            ->field(['id', 'category', 'title', 'description'])
            ->select()->toArray();

        $groups = [];
        foreach ($rows as $r) {
            $cat = $r['category'] !== '' ? $r['category'] : '其他';
            if (!isset($groups[$cat])) {
                $groups[$cat] = [];
            }
            $groups[$cat][] = ['id' => (int) $r['id'], 'title' => $r['title'], 'description' => $r['description']];
        }

        $out = [];
        foreach ($groups as $cat => $items) {
            $out[] = ['category' => $cat, 'items' => $items];
        }
        return $out;
    }

    public function create(array $d): ForbiddenItem
    {
        $title = trim((string) ($d['title'] ?? ''));
        if ($title === '') {
            throw new BizException(Code::PARAM_ERROR, '禁售项名称不能为空');
        }
        return ForbiddenItem::create([
            'category'    => trim((string) ($d['category'] ?? '')) ?: '其他',
            'title'       => $title,
            'description' => trim((string) ($d['description'] ?? '')),
            'sort'        => (int) ($d['sort'] ?? 0),
            'status'      => isset($d['status']) ? ((int) $d['status'] === 0 ? 0 : 1) : ForbiddenItem::STATUS_SHOWN,
        ]);
    }

    public function update(int $id, array $d): ForbiddenItem
    {
        $f = $this->find($id);
        $patch = [];
        if (array_key_exists('category', $d)) {
            $patch['category'] = trim((string) $d['category']) ?: '其他';
        }
        if (array_key_exists('title', $d)) {
            $title = trim((string) $d['title']);
            if ($title === '') {
                throw new BizException(Code::PARAM_ERROR, '禁售项名称不能为空');
            }
            $patch['title'] = $title;
        }
        if (array_key_exists('description', $d)) {
            $patch['description'] = trim((string) $d['description']);
        }
        if (array_key_exists('sort', $d) && $d['sort'] !== '' && $d['sort'] !== null) {
            $patch['sort'] = (int) $d['sort'];
        }
        if (array_key_exists('status', $d) && $d['status'] !== '' && $d['status'] !== null) {
            $patch['status'] = (int) $d['status'] === 0 ? 0 : 1;
        }
        if ($patch) {
            $f->save($patch);
        }
        return $f;
    }

    public function delete(int $id): void
    {
        $this->find($id)->delete();
    }

    private function find(int $id): ForbiddenItem
    {
        $f = ForbiddenItem::find($id);
        if (!$f) {
            throw new BizException(Code::NOT_FOUND, '禁售项不存在');
        }
        return $f;
    }
}
