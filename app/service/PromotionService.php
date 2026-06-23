<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\Promotion;
use app\util\Money;

/**
 * 商户订单级促销(满减/满折):CRUD + 取最优可用促销。
 * 金额一律 bcmath;防 0 元单(应付下限 0.01)。
 */
class PromotionService
{
    private const EDITABLE = ['name', 'type', 'threshold', 'value', 'status', 'start_at', 'end_at'];

    public function list(int $merchantId): array
    {
        return Promotion::where('merchant_id', $merchantId)->order('id', 'desc')->select()->toArray();
    }

    public function create(int $merchantId, array $d): Promotion
    {
        $type  = $this->normalizeType($d['type'] ?? Promotion::TYPE_FULL_REDUCE);
        $value = Money::add((string) ($d['value'] ?? '0'), '0');
        $this->validateValueByType($type, $value);
        // L24 时间窗:规范化为 Y-m-d H:i:s 并校验 开始≤结束
        $startAt = $this->normWindow($d['start_at'] ?? null);
        $endAt   = $this->normWindow($d['end_at'] ?? null);
        $this->assertWindowOrder($startAt, $endAt);
        return Promotion::create([
            'merchant_id' => $merchantId,
            'name'        => trim((string) ($d['name'] ?? '')),
            'type'        => $type,
            'threshold'   => Money::add((string) ($d['threshold'] ?? '0'), '0'),
            'value'       => $value,
            'status'      => isset($d['status']) ? ((int) $d['status'] === 0 ? 0 : 1) : Promotion::STATUS_ON,
            'start_at'    => $startAt,
            'end_at'      => $endAt,
        ]);
    }

    public function update(int $merchantId, int $id, array $d): Promotion
    {
        $p = $this->findOwned($merchantId, $id);
        $patch = array_intersect_key($d, array_flip(self::EDITABLE));
        foreach (['threshold', 'value'] as $k) {
            if (array_key_exists($k, $patch)) {
                $patch[$k] = Money::add((string) $patch[$k], '0');
            }
        }
        if (array_key_exists('type', $patch)) {
            $patch['type'] = $this->normalizeType($patch['type']);
        }
        if (array_key_exists('status', $patch)) {
            $patch['status'] = (int) $patch['status'] === 0 ? 0 : 1;
        }
        foreach (['start_at', 'end_at'] as $k) {
            if (array_key_exists($k, $patch)) {
                $patch[$k] = $this->normWindow($patch[$k]);
            }
        }
        // L24 开始≤结束:用补丁后的有效窗口复核(单改一端也要校验)
        if (array_key_exists('start_at', $patch) || array_key_exists('end_at', $patch)) {
            $effStart = array_key_exists('start_at', $patch) ? $patch['start_at'] : ($p->start_at !== null ? (string) $p->start_at : null);
            $effEnd   = array_key_exists('end_at', $patch) ? $patch['end_at'] : ($p->end_at !== null ? (string) $p->end_at : null);
            $this->assertWindowOrder($effStart, $effEnd);
        }
        if (array_key_exists('type', $patch) || array_key_exists('value', $patch)) {
            $effType  = array_key_exists('type', $patch) ? (int) $patch['type'] : (int) $p->type;
            $effValue = array_key_exists('value', $patch) ? (string) $patch['value'] : (string) $p->value;
            $this->validateValueByType($effType, $effValue);
        }
        if ($patch) {
            $p->save($patch);
        }
        return $p;
    }

    /** 满折 value∈(0,100)(90=满减后九折);满减 value>0。防 value=0/100 算出近乎0元或无效活动。 */
    private function validateValueByType(int $type, string $value): void
    {
        if ($type === Promotion::TYPE_FULL_DISCOUNT) {
            if (Money::cmp($value, '0') <= 0 || Money::cmp($value, '100') >= 0) {
                throw new BizException(Code::PARAM_ERROR, '满折折扣须在 1~99 之间(如 90 表示九折)');
            }
        } else {
            if (Money::cmp($value, '0') <= 0) {
                throw new BizException(Code::PARAM_ERROR, '满减金额须大于 0');
            }
        }
    }

    public function delete(int $merchantId, int $id): void
    {
        $this->findOwned($merchantId, $id)->delete();
    }

    /**
     * 取该商户对给定订单额的最优可用促销。返回 ['discount'=>string,'label'=>string] 或 null(无可用)。
     * 多条满足门槛时取优惠额最大者;折扣额受「防 0 元单」封顶(应付下限 0.01)。
     */
    public function bestPromotion(int $merchantId, string $amount): ?array
    {
        $rows = Promotion::where('merchant_id', $merchantId)
            ->where('status', Promotion::STATUS_ON)
            ->select();

        $now  = date('Y-m-d H:i:s');
        $best = null;
        foreach ($rows as $p) {
            if (!$this->withinWindow($p, $now)) {
                continue; // 不在限时活动窗口内(未开始/已过期)
            }
            if (Money::cmp($amount, (string) $p->threshold) < 0) {
                continue; // 未达门槛
            }
            $discount = $this->discountOf($p, $amount);
            if (Money::cmp($discount, '0') <= 0) {
                continue;
            }
            if ($best === null || Money::cmp($discount, $best['discount']) > 0) {
                $best = [
                    'discount' => $discount,
                    'label'    => (int) $p->type === Promotion::TYPE_FULL_DISCOUNT ? '满折' : '满减',
                ];
            }
        }
        return $best;
    }

    private function discountOf(Promotion $p, string $amount): string
    {
        if ((int) $p->type === Promotion::TYPE_FULL_DISCOUNT) {
            $rate = Money::mul((string) $p->value, '0.01'); // 90 → 0.90
            $pay  = Money::mul($amount, $rate);
            $discount = Money::sub($amount, $pay);
        } else {
            $discount = Money::add((string) $p->value, '0');
        }
        // 防 0 元单:优惠 ≤ 订单额-0.01;非负
        $maxAllowed = Money::sub($amount, '0.01');
        if (Money::cmp($maxAllowed, '0') < 0) {
            $maxAllowed = '0.00';
        }
        if (Money::cmp($discount, $maxAllowed) > 0) {
            $discount = $maxAllowed;
        }
        return Money::cmp($discount, '0') < 0 ? '0.00' : $discount;
    }

    private function normalizeType($type): int
    {
        $t = (int) $type;
        return in_array($t, Promotion::TYPES, true) ? $t : Promotion::TYPE_FULL_REDUCE;
    }

    /** 时间窗输入归一:空串/空白 → null(该端不限制) */
    /** 时间窗规范化:空→null;否则 strtotime 解析为 Y-m-d H:i:s,非法格式拒绝(L24)。 */
    private function normWindow($v): ?string
    {
        $v = trim((string) ($v ?? ''));
        if ($v === '') {
            return null;
        }
        $ts = strtotime($v);
        if ($ts === false) {
            throw new BizException(Code::PARAM_ERROR, '时间格式不正确');
        }
        return date('Y-m-d H:i:s', $ts);
    }

    /** 开始时间不得晚于结束时间(两端均规范化为 Y-m-d H:i:s 后字符串比较即按时序)。 */
    private function assertWindowOrder(?string $start, ?string $end): void
    {
        if ($start !== null && $end !== null && $start > $end) {
            throw new BizException(Code::PARAM_ERROR, '开始时间不能晚于结束时间');
        }
    }

    /** 当前时刻是否落在促销 [start_at, end_at] 窗口内(任一端为空=该端不限制) */
    private function withinWindow(Promotion $p, string $now): bool
    {
        $start = trim((string) ($p->start_at ?? ''));
        $end   = trim((string) ($p->end_at ?? ''));
        if ($start !== '' && $now < $start) {
            return false;
        }
        if ($end !== '' && $now > $end) {
            return false;
        }
        return true;
    }

    private function findOwned(int $merchantId, int $id): Promotion
    {
        $p = Promotion::find($id);
        if (!$p) {
            throw new BizException(Code::NOT_FOUND, '促销不存在');
        }
        if ((int) $p->merchant_id !== $merchantId) {
            throw new BizException(Code::FORBIDDEN, '无权操作他人资源');
        }
        return $p;
    }
}
