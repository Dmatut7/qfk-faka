<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\InviteCodeService;

/**
 * 平台后台:注册邀请码管理(受 AdminAuth 保护)。
 */
class InviteCodes extends BaseApiController
{
    public function index(InviteCodeService $svc)
    {
        return $this->success($svc->list());
    }

    /**
     * 批量生成邀请码。count 默认 1;max_uses 默认 1(0=不限);note 可选。
     */
    public function create(InviteCodeService $svc)
    {
        $count   = (int) $this->input('count', 1);
        $note    = $this->input('note', null);
        $maxUses = $this->input('max_uses', null);
        $maxUses = ($maxUses === null || $maxUses === '') ? 1 : (int) $maxUses;

        if ($count <= 0) {
            $count = 1;
        }

        $codes = $svc->generate($count, $note !== null ? (string) $note : null, $maxUses);

        return $this->success([
            'count' => count($codes),
            'items' => array_map(static function ($c) {
                return [
                    'id'         => (int) $c->id,
                    'code'       => $c->code,
                    'status'     => (int) $c->status,
                    'note'       => $c->note,
                    'max_uses'   => (int) $c->max_uses,
                    'used_count' => (int) $c->used_count,
                ];
            }, $codes),
        ]);
    }

    public function disable(InviteCodeService $svc, $id)
    {
        $c = $svc->disable((int) $id);
        return $this->success([
            'id'     => (int) $c->id,
            'status' => (int) $c->status,
        ]);
    }

    public function delete(InviteCodeService $svc, $id)
    {
        $svc->delete((int) $id);
        return $this->success(['id' => (int) $id]);
    }
}
