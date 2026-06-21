<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Product;
use app\service\CardService;
use tests\TestCase;
use think\facade\Db;

/**
 * 卡密并发导入安全 (评审 high 回归):两个进程同时导入【部分重叠】的批次,
 * 不得因 uniq_secret 冲突整批失败/丢卡/500,且 stock 与真实卡数一致。
 */
class CardImportConcurrencyTest extends TestCase
{
    protected bool $useTransaction = false;

    private int $merchantId = 0;
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        if (!function_exists('pcntl_fork')) {
            $this->markTestSkipped('需要 pcntl 扩展');
        }
        $this->merchantId = (int) $this->makeMerchant()->id;
        $this->tmpDir = sys_get_temp_dir() . '/qfk_imp_' . getmypid() . '_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        if ($this->merchantId) {
            $pids = Product::where('merchant_id', $this->merchantId)->column('id');
            Db::name('cards')->where('merchant_id', $this->merchantId)->delete();
            if ($pids) {
                Db::name('products')->whereIn('id', $pids)->delete();
            }
            Db::name('merchants')->where('id', $this->merchantId)->delete();
        }
        if (is_dir($this->tmpDir)) {
            array_map('unlink', glob($this->tmpDir . '/*') ?: []);
            @rmdir($this->tmpDir);
        }
        parent::tearDown();
    }

    public function testConcurrentOverlappingImportNoLoss(): void
    {
        $rounds = 8;
        for ($r = 0; $r < $rounds; $r++) {
            $p = Product::create(['merchant_id' => $this->merchantId, 'title' => 'imp', 'price' => '1.00', 'status' => Product::STATUS_ON, 'stock' => 0]);

            $shared = ["S{$r}1", "S{$r}2", "S{$r}3"];
            $batches = [
                implode("\n", array_merge($shared, ["A{$r}1", "A{$r}2", "A{$r}3"])),
                implode("\n", array_merge($shared, ["B{$r}1", "B{$r}2", "B{$r}3"])),
            ];

            $startAt = microtime(true) + 0.10;
            $pids = []; $files = [];
            for ($i = 0; $i < 2; $i++) {
                $file = $this->tmpDir . '/' . uniqid('imp_', true);
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
                        $res = (new CardService())->import($this->merchantId, (int) $p->id, $batches[$i]);
                        file_put_contents($file, 'OK ' . (int) $res['imported']);
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

            $sumImported = 0;
            foreach ($files as $f) {
                $line = trim((string) @file_get_contents($f));
                @unlink($f);
                if (strpos($line, 'OK ') === 0) {
                    $sumImported += (int) substr($line, 3);
                } else {
                    $this->fail("第 $r 轮:导入不应失败(无 500): $line");
                }
            }

            // 9 张互异卡密(3 共享 + 3 A + 3 B),共享只入库一次,绝不丢卡
            $this->assertSame(9, Card::where('product_id', $p->id)->count(), "第 $r 轮:应有 9 张卡,无丢失");
            $this->assertSame(9, $sumImported, "第 $r 轮:两进程实际插入之和应为 9(共享只算一次)");
            // stock 与真实未售卡数严格一致
            $this->assertSame(9, (int) Product::where('id', $p->id)->value('stock'), "第 $r 轮:stock 应与卡数一致");
            $this->assertSame(9, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        }
    }
}
