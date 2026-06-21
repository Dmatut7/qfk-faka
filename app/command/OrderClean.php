<?php
declare(strict_types=1);

namespace app\command;

use app\service\OrderService;
use think\console\Command;
use think\console\Input;
use think\console\Output;

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
        $n = (new OrderService())->reclaimExpired();
        $output->writeln("[order:clean] reclaimed {$n} expired order(s)");
        return 0;
    }
}
