<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\PaymentChannel;
use app\service\pay\PayManager;

/**
 * 平台支付渠道管理:列表、创建、修改、启停、验签自测。
 *
 * config 为 JSON 字段(密钥/网关等);创建/修改时强制 config 含非空 key,
 * 防止以空密钥配置渠道导致验签被绕过(EpayDriver::verify 对空 key 也会 fail-closed)。
 */
class AdminChannelService
{
    public function list(): array
    {
        $items = PaymentChannel::order('sort', 'asc')->order('id', 'asc')->select()->toArray();
        return ['items' => $items];
    }

    /**
     * 创建渠道。code 唯一;config 须为数组且含非空 key。
     */
    public function create(array $d): PaymentChannel
    {
        $code   = trim((string) ($d['code'] ?? ''));
        $name   = trim((string) ($d['name'] ?? ''));
        $driver = trim((string) ($d['driver'] ?? ''));
        $config = $d['config'] ?? [];
        $sort   = (int) ($d['sort'] ?? 0);

        if ($code === '' || $name === '' || $driver === '') {
            throw new BizException(Code::PARAM_ERROR, 'code/name/driver 不能为空');
        }
        if (PaymentChannel::where('code', $code)->find()) {
            throw new BizException(Code::STATE_INVALID, '渠道 code 已存在');
        }
        $this->assertConfig($config);

        return PaymentChannel::create([
            'code'   => $code,
            'name'   => $name,
            'driver' => $driver,
            'config' => $config,
            'status' => PaymentChannel::STATUS_ENABLED,
            'sort'   => $sort,
        ]);
    }

    /**
     * 修改渠道(name/driver/config/sort)。code 不可改。
     */
    public function update(int $id, array $data): PaymentChannel
    {
        $ch     = $this->find($id);
        $update = [];

        if (array_key_exists('name', $data) && trim((string) $data['name']) !== '') {
            $update['name'] = trim((string) $data['name']);
        }
        if (array_key_exists('driver', $data) && trim((string) $data['driver']) !== '') {
            $update['driver'] = trim((string) $data['driver']);
        }
        if (array_key_exists('config', $data)) {
            $this->assertConfig($data['config']);
            $update['config'] = $data['config'];
        }
        if (array_key_exists('sort', $data) && $data['sort'] !== '' && $data['sort'] !== null) {
            $update['sort'] = (int) $data['sort'];
        }

        if ($update) {
            $ch->save($update);
        }
        return $ch;
    }

    /**
     * 启用/停用渠道。停用仅影响"发起支付"(PayManager::enabledChannel),不影响在途回调。
     */
    public function setStatus(int $id, bool $enable): PaymentChannel
    {
        $ch = $this->find($id);
        $ch->save(['status' => $enable ? PaymentChannel::STATUS_ENABLED : PaymentChannel::STATUS_DISABLED]);
        return $ch;
    }

    /**
     * 验签自测:用渠道驱动对样例参数验签,返回结果。
     *
     * @return array{valid: bool}
     */
    public function testSign(string $code, array $sampleParams): array
    {
        $ch = PaymentChannel::where('code', $code)->find();
        if (!$ch) {
            throw new BizException(Code::NOT_FOUND, '渠道不存在');
        }
        $manager = new PayManager();
        // 优先按 driver 字段解析驱动,回退到 code(本期 epay 二者一致)
        $driverCode = $manager->supports((string) $ch->driver) ? (string) $ch->driver : (string) $ch->code;
        $driver = $manager->driver($driverCode);

        $config = is_array($ch->config) ? $ch->config : [];
        $valid  = $driver->verify($sampleParams, $config);

        return ['valid' => $valid];
    }

    private function assertConfig($config): void
    {
        if (!is_array($config)) {
            throw new BizException(Code::PARAM_ERROR, 'config 必须为对象');
        }
        // 强制非空密钥,空 key 会导致验签 fail-closed/被绕过风险,直接拒绝
        if (!array_key_exists('key', $config) || !is_scalar($config['key']) || (string) $config['key'] === '') {
            throw new BizException(Code::PARAM_ERROR, 'config.key(密钥)不能为空');
        }
    }

    private function find(int $id): PaymentChannel
    {
        $ch = PaymentChannel::find($id);
        if (!$ch) {
            throw new BizException(Code::NOT_FOUND, '渠道不存在');
        }
        return $ch;
    }
}
