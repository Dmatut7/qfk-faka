<?php
declare(strict_types=1);

namespace app\command;

use app\model\Card;
use app\service\LowStockAlertService;
use app\util\Money;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 库存/资金对账命令:`php think stock:reconcile`(建议 cron 每日)。
 *
 * 1. 库存对账:把 products.stock 重算为 COUNT(cards WHERE product_id AND status=0 未售),
 *    修正展示缓存与真实未售卡数之间的漂移。只改 products.stock,不动 cards 状态。
 * 2. 资金自检:对每个商户,核对 SUM(merchant_fund_logs.amount) 是否与 merchants.balance 接近
 *    (流水 amount 为有符号的余额增减,从 0 累加应等于当前余额)。仅报告差异,
 *    绝不自动改余额——余额是权威。
 *
 * 幂等、安全:重算式修正,可任意重复执行;无副作用累积。
 */
class StockReconcile extends Command
{
    protected function configure(): void
    {
        $this->setName('stock:reconcile')
            ->setDescription('库存/资金对账(重算 products.stock + 报告资金流水与余额差异)');
    }

    protected function execute(Input $input, Output $output): int
    {
        // 单实例锁防重入:拿不到锁说明上一轮仍在跑,本次跳过(对账幂等,此锁仅避免无谓重复扫描)。
        $got = Db::query("SELECT GET_LOCK('qfk:stock:reconcile', 0) AS l");
        if (empty($got[0]['l'])) {
            $output->writeln('[stock:reconcile] another instance is running, skipped');
            return 0;
        }

        try {
            $fixed     = $this->reconcileStock($output);
            $mismatch  = $this->reconcileFunds($output);
            // 库存重算后做低库存预警(阈值由平台设置 low_stock_threshold 控制,≤0 关闭)。
            $alerted   = (new LowStockAlertService())->run(static function (string $msg) use ($output) {
                $output->writeln($msg);
            });

            $output->writeln("[stock:reconcile] stock fixed {$fixed} product(s); fund mismatch {$mismatch} merchant(s); low-stock alerts {$alerted}");
        } finally {
            Db::query("SELECT RELEASE_LOCK('qfk:stock:reconcile')");
        }

        return 0;
    }

    /**
     * 重算每个商品的可售库存缓存,修正漂移。返回被修正的商品数。
     */
    private function reconcileStock(Output $output): int
    {
        $fixed = 0;

        // 逐个商品比对,避免一次性加载全部 cards;数量大时仍可接受(单条聚合走 idx_pick)。
        Db::name('products')->field(['id', 'stock'])->chunk(500, function ($products) use (&$fixed, $output) {
            foreach ($products as $p) {
                $productId = (int) $p['id'];
                $real      = (int) Db::name('cards')
                    ->where('product_id', $productId)
                    ->where('status', Card::STATUS_UNSOLD)
                    ->count();

                if ((int) $p['stock'] !== $real) {
                    Db::name('products')->where('id', $productId)->update([
                        'stock'       => $real,
                        'update_time' => date('Y-m-d H:i:s'),
                    ]);
                    $output->writeln(
                        "[stock:reconcile] product #{$productId} stock {$p['stock']} -> {$real}"
                    );
                    $fixed++;
                }
            }
        });

        return $fixed;
    }

    /**
     * 资金一致性自检:SUM(fund_log.amount) 应等于商户**逻辑净头寸 balance - debt**。
     * 流水 amount 记的是逻辑净头寸的增减(B1 负欠隔离:入账先抵欠,balance_after 记 balance-debt),
     * 故对账须比 balance-debt 而非物理 balance,否则有负欠时会误报漂移。仅报告,不改余额。
     */
    private function reconcileFunds(Output $output): int
    {
        $mismatch = 0;

        Db::name('merchants')->field(['id', 'balance', 'debt'])->chunk(500, function ($merchants) use (&$mismatch, $output) {
            foreach ($merchants as $m) {
                $merchantId = (int) $m['id'];
                $sumRaw     = Db::name('merchant_fund_logs')
                    ->where('merchant_id', $merchantId)
                    ->sum('amount');

                // sum 返回 0 或字符串/数值;统一交给 Money 以 2 位小数比较。
                $logged  = Money::round((string) $sumRaw);
                $logical = Money::sub((string) $m['balance'], (string) ($m['debt'] ?? '0')); // 逻辑净头寸

                if (Money::cmp($logged, $logical) !== 0) {
                    $diff = Money::sub($logical, $logged);
                    $output->writeln(
                        "[stock:reconcile] merchant #{$merchantId} 逻辑净头寸 {$logical}(balance {$m['balance']} - debt " . ($m['debt'] ?? '0') . ") != fund logs sum {$logged} (diff {$diff})"
                    );
                    $mismatch++;
                }
            }
        });

        return $mismatch;
    }
}
