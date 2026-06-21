<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\InviteCode;
use think\facade\Db;

/**
 * 注册邀请码服务:列表 / 批量生成 / 停用 / 删除 / 核销(redeem)。
 *
 * redeem 用行级锁(SELECT ... FOR UPDATE)+ 事务内重查状态,保证并发下不超用:
 * 一张 max_uses 次的码至多被核销 max_uses 次。redeem 须在调用方事务内调用
 * (商户注册把 redeem 与建户放同一事务,保证「用了码才建户、建户失败回滚用量」)。
 */
class InviteCodeService
{
    /** 生成码的字符集:大写字母 + 数字(去掉易混的可选,这里保留全集以最大化空间) */
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    private const CODE_LEN  = 8;

    /** 后台列表:按 id 倒序,返回全部状态。 */
    public function list(): array
    {
        $items = InviteCode::order('id', 'desc')->select()->toArray();
        return ['items' => $items];
    }

    /**
     * 批量生成随机邀请码(8 位大写字母 + 数字,唯一)。
     *
     * @param int         $count   生成数量(>=1,默认 1)
     * @param string|null $note    备注
     * @param int         $maxUses 单码最大可用次数(0=不限,默认 1)
     * @return InviteCode[]
     */
    public function generate(int $count = 1, ?string $note = null, int $maxUses = 1): array
    {
        if ($count < 1) {
            throw new BizException(Code::PARAM_ERROR, '生成数量至少为 1');
        }
        if ($count > 1000) {
            throw new BizException(Code::PARAM_ERROR, '单次最多生成 1000 个');
        }
        if ($maxUses < 0) {
            throw new BizException(Code::PARAM_ERROR, 'max_uses 不能为负');
        }

        $note    = $note !== null && $note !== '' ? $note : null;
        $created = [];

        for ($i = 0; $i < $count; $i++) {
            $created[] = $this->createOneUnique($note, $maxUses);
        }
        return $created;
    }

    /** 生成一个唯一码并落库(唯一冲突时重试) */
    private function createOneUnique(?string $note, int $maxUses): InviteCode
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = $this->randomCode();
            try {
                return InviteCode::create([
                    'code'       => $code,
                    'status'     => InviteCode::STATUS_ENABLED,
                    'note'       => $note,
                    'max_uses'   => $maxUses,
                    'used_count' => 0,
                ]);
            } catch (\think\db\exception\PDOException $e) {
                if ($this->isDuplicateKey($e)) {
                    continue; // 撞码,重试
                }
                throw $e;
            } catch (\PDOException $e) {
                if ($this->isDuplicateKey($e)) {
                    continue;
                }
                throw $e;
            }
        }
        throw new BizException(Code::STATE_INVALID, '邀请码生成失败,请重试');
    }

    private function randomCode(): string
    {
        $alphabet = self::ALPHABET;
        $max      = strlen($alphabet) - 1;
        $out      = '';
        for ($i = 0; $i < self::CODE_LEN; $i++) {
            $out .= $alphabet[random_int(0, $max)];
        }
        return $out;
    }

    /** 停用一个邀请码(置 status=0)。 */
    public function disable(int $id): InviteCode
    {
        $c = $this->find($id);
        if ((int) $c->status !== InviteCode::STATUS_DISABLED) {
            $c->save(['status' => InviteCode::STATUS_DISABLED]);
        }
        return $c;
    }

    /** 删除一个邀请码:仅当 used_count=0(未被使用过)时允许。 */
    public function delete(int $id): void
    {
        $c = $this->find($id);
        if ((int) $c->used_count > 0) {
            throw new BizException(Code::STATE_INVALID, '邀请码已被使用,不能删除');
        }
        $c->delete();
    }

    /**
     * 核销邀请码:校验(存在/启用/未用尽)→ used_count+1。
     *
     * 必须在外层事务内调用。用行级锁锁住该行后在锁内重查状态,杜绝并发下两次注册
     * 同时通过校验导致超用(max_uses=1 的码被用两次)。
     *
     * @throws BizException 码不存在/已停用/已用尽
     */
    public function redeem(string $code): InviteCode
    {
        $code = trim($code);
        if ($code === '') {
            throw new BizException(Code::PARAM_ERROR, '邀请码不能为空');
        }

        // 行级锁:锁定该码这一行(不存在则返回 null)
        $row = InviteCode::where('code', $code)->lock(true)->find();
        if (!$row) {
            throw new BizException(Code::STATE_INVALID, '邀请码无效');
        }
        if (!$row->isEnabled()) {
            throw new BizException(Code::STATE_INVALID, '邀请码已停用');
        }
        if (!$row->hasRemaining()) {
            throw new BizException(Code::STATE_INVALID, '邀请码已用尽');
        }

        // 条件自增 + affected 守卫:仅当仍未用尽时 +1(max_uses=0 不限则总是可加)。
        // 锁内重查兜底,双保险防超用。
        $affected = Db::name('invite_codes')
            ->where('id', $row->id)
            ->where('status', InviteCode::STATUS_ENABLED)
            ->where(function ($q) {
                $q->where('max_uses', 0)->whereOr('used_count', '<', Db::raw('max_uses'));
            })
            ->inc('used_count')
            ->update();

        if ($affected !== 1) {
            throw new BizException(Code::STATE_INVALID, '邀请码已用尽');
        }

        $row->used_count = (int) $row->used_count + 1;
        return $row;
    }

    private function find(int $id): InviteCode
    {
        $c = InviteCode::find($id);
        if (!$c) {
            throw new BizException(Code::NOT_FOUND, '邀请码不存在');
        }
        return $c;
    }

    private function isDuplicateKey(\Throwable $e): bool
    {
        if (false !== strpos($e->getMessage(), 'Duplicate entry')) {
            return true;
        }
        if ($e instanceof \PDOException && isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1062) {
            return true;
        }
        return false;
    }
}
