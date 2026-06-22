<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Merchant;
use app\util\Money;

/**
 * 平台侧商户管理:创建、审核、冻结/解冻、改抽佣、重置密码、搜索。
 */
class AdminMerchantService
{
    public function list(array $filter, int $page = 1, int $size = 20): array
    {
        // 非 status 的基础筛选(keyword);供"列表"与"全局状态计数"共用,
        // 让统计卡反映全局各状态总数(不随分页/所选状态 tab 失真)。
        $applyBase = function ($q) use ($filter) {
            if (!empty($filter['keyword'])) {
                $q->where('username|store_name|email', 'like', '%' . $filter['keyword'] . '%');
            }
            return $q;
        };

        // 全局各状态计数(忽略 status 筛选与分页,保留 keyword 筛选)
        $rows = $applyBase(Merchant::field('status, COUNT(*) AS c'))->group('status')->select()->toArray();
        $statusCounts = [];
        foreach ($rows as $r) {
            $statusCounts[(int) $r['status']] = (int) $r['c'];
        }

        $q = $applyBase(Merchant::order('id', 'desc'));
        if (isset($filter['status']) && $filter['status'] !== '') {
            $q->where('status', (int) $filter['status']);
        }
        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();
        return ['total' => $total, 'page' => $page, 'items' => $items, 'status_counts' => $statusCounts];
    }

    /** 审核通过:待审核(0)→ 正常(1) */
    public function approve(int $merchantId): Merchant
    {
        $m = $this->find($merchantId);
        if ((int) $m->status !== Merchant::STATUS_PENDING) {
            throw new BizException(Code::STATE_INVALID, '仅待审核商户可审核');
        }
        $m->save(['status' => Merchant::STATUS_ACTIVE]);
        return $m;
    }

    /** 冻结:→ 冻结(2),并吊销其全部登录令牌 */
    public function freeze(int $merchantId): Merchant
    {
        $m = $this->find($merchantId);
        $m->save(['status' => Merchant::STATUS_FROZEN]);
        (new TokenService())->revokeAllFor(AccessToken::OWNER_MERCHANT, $merchantId);
        return $m;
    }

    /** 解冻:冻结(2)→ 正常(1) */
    public function unfreeze(int $merchantId): Merchant
    {
        $m = $this->find($merchantId);
        if ((int) $m->status !== Merchant::STATUS_FROZEN) {
            throw new BizException(Code::STATE_INVALID, '仅冻结商户可解冻');
        }
        $m->save(['status' => Merchant::STATUS_ACTIVE]);
        return $m;
    }

    /** 设置抽佣比例(0~1) */
    public function setCommission(int $merchantId, string $rate): Merchant
    {
        if (!preg_match('/^\d(\.\d{1,4})?$/', $rate) || Money::cmp($rate, '1') > 0 || Money::cmp($rate, '0') < 0) {
            throw new BizException(Code::PARAM_ERROR, '抽佣比例须在 0~1 之间');
        }
        $m = $this->find($merchantId);
        $m->save(['commission_rate' => $rate]);
        return $m;
    }

    /** 平台重置商户密码,并吊销其全部令牌 */
    public function resetPassword(int $merchantId, string $newPassword): Merchant
    {
        $m = $this->find($merchantId);
        $m->save(['password' => password_hash($newPassword, PASSWORD_BCRYPT)]);
        (new TokenService())->revokeAllFor(AccessToken::OWNER_MERCHANT, $merchantId);
        return $m;
    }

    private function find(int $merchantId): Merchant
    {
        $m = Merchant::find($merchantId);
        if (!$m) {
            throw new BizException(Code::NOT_FOUND, '商户不存在');
        }
        return $m;
    }

    /**
     * 平台创建商户账号(直接置为正常状态)。
     */
    public function create(array $d): Merchant
    {
        if (Merchant::where('username', $d['username'])->find()) {
            throw new BizException(Code::STATE_INVALID, '用户名已存在');
        }
        if (Merchant::where('store_slug', $d['store_slug'])->find()) {
            throw new BizException(Code::STATE_INVALID, '店铺标识已存在');
        }
        if (!empty($d['email']) && Merchant::where('email', $d['email'])->find()) {
            throw new BizException(Code::STATE_INVALID, '邮箱已被使用');
        }

        return Merchant::create([
            'username'        => $d['username'],
            'password'        => password_hash($d['password'], PASSWORD_BCRYPT),
            'email'           => $d['email'] ?? null,
            'phone'           => $d['phone'] ?? null,
            'store_name'      => $d['store_name'],
            'store_slug'      => $d['store_slug'],
            'status'          => Merchant::STATUS_ACTIVE,
            'commission_rate' => $d['commission_rate'] ?? '0.0000',
        ]);
    }
}
