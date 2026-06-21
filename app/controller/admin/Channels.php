<?php
declare(strict_types=1);

namespace app\controller\admin;

use app\common\BizException;
use app\common\Code;
use app\controller\BaseApiController;
use app\model\PaymentChannel;
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
        // 「对哪条渠道验签」由 URL 路径 id 决定:以 id 查渠道取其 code;
        // body code 仅在路径渠道不存在时兜底(兼容旧调用)。
        $code = '';
        $ch   = PaymentChannel::find((int) $id);
        if ($ch) {
            $code = (string) $ch->code;
        } else {
            $code = (string) $this->input('code', '');
            if ($code === '') {
                throw new BizException(Code::NOT_FOUND, '渠道不存在');
            }
        }

        $sample = $this->input('sample_params', []);
        if (!is_array($sample)) {
            $sample = [];
        }
        return $this->success($svc->testSign($code, $sample));
    }
}
