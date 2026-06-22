<?php
declare(strict_types=1);

namespace app\service;

use app\model\SystemLog;
use think\facade\Log;

/**
 * 系统日志服务。
 *
 * 铁律:日志是旁路设施,绝不能拖垮业务。
 * record() 内部整体 try/catch,任何异常(含表不存在、写库失败)一律吞掉、绝不外抛,
 * 失败时退化为框架文件日志,主流程返回/行为完全不受影响。
 */
class SystemLogService
{
    /**
     * 记录一条系统日志。失败绝不抛出。
     *
     * @param string      $type    业务类型,如 pay_verify_fail / settle_exception / withdraw_approve
     * @param string      $level   info / warning / error
     * @param string      $message 摘要
     * @param array       $context 结构化上下文(json)
     * @param string|null $orderNo 关联订单号(可空)
     */
    public function record(string $type, string $level, string $message, array $context = [], ?string $orderNo = null): void
    {
        try {
            SystemLog::create([
                'type'        => $type,
                'level'       => $level !== '' ? $level : SystemLog::LEVEL_INFO,
                'order_no'    => $orderNo,
                'message'     => mb_substr($message, 0, 500),
                'context'     => $context,
                'create_time' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // 记录失败绝不影响主流程,退化为文件日志
            try {
                Log::error('[system_log] record failed: ' . $e->getMessage());
            } catch (\Throwable $ignore) {
                // 连文件日志都失败也彻底吞掉
            }
        }
    }

    /**
     * 记录一条平台操作审计(type=admin_op)。actor 为操作管理员 id。
     * 旁路设施,失败绝不影响主流程。
     */
    public function operation(int $actorId, string $action, string $message, array $context = []): void
    {
        $this->record('admin_op', SystemLog::LEVEL_INFO, $message, array_merge(
            ['action' => $action, 'actor_id' => $actorId],
            $context
        ));
    }

    /**
     * 记录一条风控事件(type=risk_event)。risk 为风险子类型(如 blacklist_block)。
     * 旁路设施,失败绝不影响主流程。
     */
    public function risk(string $risk, string $message, array $context = []): void
    {
        $this->record('risk_event', SystemLog::LEVEL_WARNING, $message, array_merge(['risk' => $risk], $context));
    }

    /** 风控记录:聚合黑名单拦截(risk_event)与支付异常(settle_exception),按时间倒序分页。 */
    public function riskList(int $page = 1, int $size = 20): array
    {
        $page = $page > 0 ? $page : 1;
        $q = SystemLog::whereIn('type', ['risk_event', 'settle_exception'])->order('id', 'desc');
        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();
        return ['total' => $total, 'page' => $page, 'items' => $items];
    }

    /**
     * 分页查询(可按 type / level 筛选),按时间倒序。
     * 返回 {total, page, items}。
     */
    public function list(array $filter, int $page = 1, int $size = 20): array
    {
        $page = $page > 0 ? $page : 1;
        $size = $size > 0 ? $size : 20;

        $q = SystemLog::order('id', 'desc');
        if (isset($filter['type']) && $filter['type'] !== '') {
            $q->where('type', (string) $filter['type']);
        }
        if (isset($filter['level']) && $filter['level'] !== '') {
            $q->where('level', (string) $filter['level']);
        }

        $total = $q->count();
        $items = $q->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }
}
