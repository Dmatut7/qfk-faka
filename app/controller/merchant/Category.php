<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\CategoryService;

/**
 * 商户后台:分类管理(受 MerchantAuth 保护,均限当前商户)。
 */
class Category extends BaseApiController
{
    public function index(CategoryService $svc)
    {
        return $this->success($svc->list($this->authId()));
    }

    public function create(CategoryService $svc)
    {
        $d = $this->params(['name', 'image', 'sort', 'status']);
        $this->validate($d, ['name' => 'require|max:64'], ['name.require' => '分类名必填']);
        return $this->success($svc->create($this->authId(), $d)->toArray());
    }

    public function update(CategoryService $svc, $id)
    {
        $d = $this->params(['name', 'image', 'sort', 'status']);
        return $this->success($svc->update($this->authId(), (int) $id, $d)->toArray());
    }

    public function delete(CategoryService $svc, $id)
    {
        $svc->delete($this->authId(), (int) $id);
        return $this->success();
    }
}
