<?php
declare(strict_types=1);

namespace app\command;

use app\service\OrderService;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 订单超时回收命令:`php think order:clean`(建议 cron 每分钟)。
 * 关闭过期未支付订单、释放其锁定卡、回补库存。幂等,可安全重复执行。
 */
class OrderClean extends Command
{
    protected function configure(): void
    {
        $this->setName('order:clean')
            ->setDescription('回收过期未支付订单(关单 + 释放锁定卡 + 回补库存)');
    }

    protected function execute(Input $input, Output $output): int
    {
        // 单实例锁防重入(spec §10.3.6):拿不到锁说明上一轮仍在跑,本次跳过。
        // (回收本身幂等,此锁只为避免无谓的重复扫描与锁竞争)
        $got = Db::query("SELECT GET_LOCK('qfk:order:clean', 0) AS l");
        if (empty($got[0]['l'])) {
            $output->writeln('[order:clean] another instance is running, skipped');
            return 0;
        }

        try {
            $n = (new OrderService())->reclaimExpired();
            $output->writeln("[order:clean] reclaimed {$n} expired order(s)");
        } finally {
            Db::query("SELECT RELEASE_LOCK('qfk:order:clean')");
        }
        return 0;
    }
}
