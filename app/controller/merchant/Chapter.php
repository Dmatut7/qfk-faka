<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\ChapterService;

/**
 * 商户后台:知识类商品章节管理(受 MerchantAuth 保护,均限当前商户)。
 */
class Chapter extends BaseApiController
{
    public function index(ChapterService $svc, $productId)
    {
        return $this->success(['items' => $svc->listForMerchant($this->authId(), (int) $productId)]);
    }

    public function create(ChapterService $svc, $productId)
    {
        $d = $this->params(['title', 'content', 'sort', 'status']);
        $this->validate($d, ['title' => 'require|max:200']);
        $c = $svc->create($this->authId(), (int) $productId, $d);
        return $this->success(['id' => (int) $c->id]);
    }

    public function update(ChapterService $svc, $id)
    {
        $d = $this->params(['title', 'content', 'sort', 'status']);
        $svc->update($this->authId(), (int) $id, $d);
        return $this->success(['id' => (int) $id]);
    }

    public function delete(ChapterService $svc, $id)
    {
        $svc->delete($this->authId(), (int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
