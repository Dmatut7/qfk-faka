<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Category;

/**
 * 商户分类管理。所有操作严格限定在当前商户范围内。
 */
class CategoryService
{
    public function list(int $merchantId): array
    {
        return Category::where('merchant_id', $merchantId)
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function create(int $merchantId, array $d): Category
    {
        return Category::create([
            'merchant_id' => $merchantId,
            'name'        => $d['name'],
            'sort'        => (int) ($d['sort'] ?? 0),
            'status'      => isset($d['status']) ? (int) $d['status'] : Category::STATUS_SHOWN,
        ]);
    }

    public function update(int $merchantId, int $id, array $d): Category
    {
        $c = $this->findOwned($merchantId, $id);
        $patch = array_intersect_key($d, array_flip(['name', 'sort', 'status']));
        if ($patch) {
            $c->save($patch);
        }
        return $c;
    }

    public function delete(int $merchantId, int $id): void
    {
        $this->findOwned($merchantId, $id)->delete();
    }

    /**
     * 取本商户的分类,不存在 404,非本人 403。
     */
    private function findOwned(int $merchantId, int $id): Category
    {
        $c = Category::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '分类不存在');
        }
        if ((int) $c->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        return $c;
    }
}
