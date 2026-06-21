<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\controller\BaseApiController;
use app\service\AdminChannelService;

/**
 * 平台后台:支付渠道管理(受 AdminAuth 保护)。
 */
class Channels extends BaseApiController
{
    public function index(AdminChannelService $svc)
    {
        return $this->success($svc->list());
    }

    public function create(AdminChannelService $svc)
    {
        $data = $this->params(['code', 'name', 'driver', 'config', 'sort']);
        $this->validate($data, [
            'code'   => 'require|length:2,32',
            'name'   => 'require|max:64',
            'driver' => 'require|max:64',
        ]);
        $data['config'] = $this->input('config', []);

        $ch = $svc->create($data);

        return $this->success([
            'id'     => (int) $ch->id,
            'code'   => $ch->code,
            'name'   => $ch->name,
            'driver' => $ch->driver,
            'status' => (int) $ch->status,
            'sort'   => (int) $ch->sort,
        ]);
    }

    public function update(AdminChannelService $svc, $id)
    {
        $data = $this->params(['name', 'driver', 'sort']);
        if ($this->request->has('config')) {
            $data['config'] = $this->input('config', []);
        }
        $ch = $svc->update((int) $id, $data);

        return $this->success([
            'id'     => (int) $ch->id,
            'name'   => $ch->name,
            'driver' => $ch->driver,
            'sort'   => (int) $ch->sort,
        ]);
    }

    public function setStatus(AdminChannelService $svc, $id)
    {
        $enable = (bool) $this->input('enable', false);
        $ch     = $svc->setStatus((int) $id, $enable);
        return $this->success(['status' => (int) $ch->status]);
    }

    public function testSign(AdminChannelService $svc, $id)
    {
        $code   = (string) $this->input('code', '');
        $sample = $this->input('sample_params', []);
        if (!is_array($sample)) {
            $sample = [];
        }
        return $this->success($svc->testSign($code, $sample));
    }
}
