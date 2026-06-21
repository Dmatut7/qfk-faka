<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\Withdrawal;
use app\service\MerchantWalletService;
use app\util\Money;
use tests\TestCase;
use think\facade\Db;

/**
 * 提现并发不双花 (T7.2):余额 100,两进程各申请 60 → 只能成功一次。
 */
class MerchantWithdrawConcurrencyTest extends TestCase
{
    protected bool $useTransaction = false;

    private array $merchantIds = [];
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        if (!function_exists('pcntl_fork')) {
            $this->markTestSkipped('需要 pcntl 扩展');
        }
        $this->tmpDir = sys_get_temp_dir() . '/qfk_wd_' . getmypid() . '_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        foreach ($this->merchantIds as $id) {
            Db::name('merchant_fund_logs')->where('merchant_id', $id)->delete();
            Db::name('withdrawals')->where('merchant_id', $id)->delete();
            Db::name('merchants')->where('id', $id)->delete();
        }
        if (is_dir($this->tmpDir)) {
            array_map('unlink', glob($this->tmpDir . '/*') ?: []);
            @rmdir($this->tmpDir);
        }
        parent::tearDown();
    }

    public function testConcurrentWithdrawNoDoubleSpend(): void
    {
        $rounds = 8;
        for ($r = 0; $r < $rounds; $r++) {
            $m = $this->makeMerchant(['balance' => '100.00']);
            $this->merchantIds[] = (int) $m->id;

            $startAt = microtime(true) + 0.10;
            $pids = []; $files = [];
            for ($w = 0; $w < 2; $w++) {
                $file = $this->tmpDir . '/' . uniqid('w_', true);
                $files[] = $file;
                $pid = pcntl_fork();
                if ($pid === -1) {
                    $this->fail('fork 失败');
                }
                if ($pid === 0) {
                    Db::connect('mysql', true);
                    try {
                        Db::query('SELECT 1');
                    } catch (\Throwable $e) {
                        file_put_contents($file, 'ERR conn');
                        exit(0);
                    }
                    if ($startAt > microtime(true)) {
                        @time_sleep_until($startAt);
                    }
                    try {
                        (new MerchantWalletService())->applyWithdrawal((int) $m->id, '60.00', 'acc');
                        file_put_contents($file, 'OK');
                    } catch (\app\common\BizException $e) {
                        file_put_contents($file, 'FAIL ' . $e->getBizCode());
                    } catch (\Throwable $e) {
                        file_put_contents($file, 'ERR ' . str_replace("\n", ' ', $e->getMessage()));
                    }
                    exit(0);
                }
                $pids[] = $pid;
            }
            foreach ($pids as $pid) {
                pcntl_waitpid($pid, $status);
            }
            Db::connect('mysql', true);

            $ok = 0;
            foreach ($files as $f) {
                $line = trim((string) @file_get_contents($f));
                @unlink($f);
                if ($line === 'OK') {
                    $ok++;
                } elseif (strpos($line, 'FAIL') !== 0) {
                    $this->fail("第 $r 轮异常: $line");
                }
            }

            // 只能成功一次
            $this->assertSame(1, $ok, "第 $r 轮:60 元提现从 100 元余额只能成功一次");
            $reload = Merchant::find($m->id);
            $this->assertSame('40.00', $reload->balance);
            $this->assertSame('60.00', $reload->frozen_balance);
            // 守恒
            $this->assertSame(0, Money::cmp(Money::add($reload->balance, $reload->frozen_balance), '100.00'));
            // 只有一条提现单
            $this->assertSame(1, Withdrawal::where('merchant_id', $m->id)->count());
        }
    }
}
