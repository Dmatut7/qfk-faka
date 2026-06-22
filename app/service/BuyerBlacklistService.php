<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\BuyerBlacklist;

/**
 * 买家黑名单(平台级):邮箱归一为小写存储/匹配。下单前以 isBlocked 拦截。
 */
class BuyerBlacklistService
{
    public function list(string $keyword = ''): array
    {
        $q = BuyerBlacklist::order('id', 'desc');
        if ($keyword !== '') {
            $q->where('email', 'like', '%' . strtolower(trim($keyword)) . '%');
        }
        return $q->select()->toArray();
    }

    public function add(string $email, string $reason = ''): BuyerBlacklist
    {
        $email = strtolower(trim($email));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BizException(Code::PARAM_ERROR, '邮箱格式不正确');
        }
        $exist = BuyerBlacklist::where('email', $email)->find();
        if ($exist) {
            // 已存在则确保生效并更新原因(幂等)
            $exist->save(['status' => BuyerBlacklist::STATUS_ON, 'reason' => trim($reason)]);
            return $exist;
        }
        return BuyerBlacklist::create([
            'email'  => $email,
            'reason' => trim($reason),
            'status' => BuyerBlacklist::STATUS_ON,
        ]);
    }

    /** 解除拉黑(置 status=0,保留记录便于审计) */
    public function remove(int $id): void
    {
        $b = BuyerBlacklist::find($id);
        if (!$b) {
            throw new BizException(Code::NOT_FOUND, '记录不存在');
        }
        $b->save(['status' => BuyerBlacklist::STATUS_OFF]);
    }

    public function isBlocked(string $email): bool
    {
        $email = strtolower(trim($email));
        if ($email === '') {
            return false;
        }
        return BuyerBlacklist::where('email', $email)
            ->where('status', BuyerBlacklist::STATUS_ON)
            ->find() !== null;
    }
}
