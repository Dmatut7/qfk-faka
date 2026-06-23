<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\model\Card;
use app\model\Coupon;
use app\model\Order;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;
use think\facade\Db;

/**
 * 并发安全的"一卡一售"专项测试 (T5.3)。
 *
 * 真实并发:pcntl_fork 多个独立进程 → 各自强制独立 MySQL 连接 →
 * 时间栅栏同步起跑 → 真实提交(非事务回滚)。多轮重复以暴露竞态。
 *
 * 不变量:任意并发下一张卡至多归属一个订单、不超卖。
 */
class OrderConcurrencyTest extends TestCase
{
    // 关闭事务回滚隔离:并发需各连接看到彼此已提交数据
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
        $this->tmpDir = sys_get_temp_dir() . '/qfk_conc_' . getmypid() . '_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        // 并发用例真实提交,需手动清库(注意外键顺序)
        if ($this->merchantId) {
            $pids = Product::where('merchant_id', $this->merchantId)->column('id');
            Db::name('cards')->where('merchant_id', $this->merchantId)->delete();
            Db::name('orders')->where('merchant_id', $this->merchantId)->delete();
            Db::name('coupons')->where('merchant_id', $this->merchantId)->delete();
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

    private function freshProductWithCards(int $cards, array $productOverride = []): Product
    {
        $p = Product::create(array_merge([
            'merchant_id' => $this->merchantId, 'title' => 'conc', 'price' => '1.00',
            'status' => Product::STATUS_ON, 'stock' => $cards,
        ], $productOverride));
        $rows = [];
        $now = date('Y-m-d H:i:s');
        for ($i = 0; $i < $cards; $i++) {
            $s = 'CC-' . $p->id . '-' . $i;
            $rows[] = ['merchant_id' => $this->merchantId, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s), 'status' => Card::STATUS_UNSOLD, 'create_time' => $now, 'update_time' => $now];
        }
        Card::insertAll($rows);
        return $p;
    }

    /**
     * 并发跑一轮:$n 个买家各买 $qty 张,返回 ['ok'=>int, 'fail'=>int, 'cardIds'=>[], 'orderIds'=>[]]。
     */
    private function race(int $productId, int $n, int $qty, string $couponCode = ''): array
    {
        $startAt = microtime(true) + 0.10; // 起跑栅栏
        $pids = [];
        $files = [];

        for ($i = 0; $i < $n; $i++) {
            $file = $this->tmpDir . '/' . uniqid('w_', true);
            $files[] = $file;
            $pid = pcntl_fork();
            if ($pid === -1) {
                $this->fail('fork 失败');
            }
            if ($pid === 0) {
                // ===== 子进程 =====
                Db::connect('mysql', true);              // 强制独立连接
                try {
                    Db::query('SELECT 1'); // 预热连接;失败必须暴露为 ERR,不可吞掉伪装成库存不足
                } catch (\Throwable $e) {
                    file_put_contents($file, 'ERR conn ' . $e->getMessage());
                    exit(0);
                }
                if ($startAt > microtime(true)) {
                    @time_sleep_until($startAt);
                }
                $out = 'ERR';
                try {
                    $payload = ['product_id' => $productId, 'quantity' => $qty, 'buyer_email' => 'c@x.com'];
                    if ($couponCode !== '') { $payload['coupon_code'] = $couponCode; }
                    $order = (new OrderService())->create($payload);
                    $cardIds = Card::where('order_id', $order->id)->column('id');
                    $out = 'OK ' . $order->id . ' ' . implode(',', $cardIds);
                } catch (BizException $e) {
                    $out = 'FAIL ' . $e->getBizCode();
                } catch (\Throwable $e) {
                    $out = 'ERR ' . str_replace("\n", ' ', $e->getMessage());
                }
                file_put_contents($file, $out);
                exit(0);
            }
            $pids[] = $pid;
        }

        foreach ($pids as $pid) {
            pcntl_waitpid($pid, $status);
        }

        // 子进程可能已关闭共享 socket,父进程重连后再断言
        Db::connect('mysql', true);

        $ok = 0; $fail = 0; $cardIds = []; $orderIds = [];
        foreach ($files as $f) {
            $line = trim((string) @file_get_contents($f));
            @unlink($f);
            if (strpos($line, 'OK ') === 0) {
                $ok++;
                [, $oid, $cids] = explode(' ', $line) + [null, null, ''];
                $orderIds[] = (int) $oid;
                foreach (array_filter(explode(',', $cids)) as $cid) {
                    $cardIds[] = (int) $cid;
                }
            } elseif (strpos($line, 'FAIL') === 0) {
                $fail++;
            } else {
                $this->fail('子进程异常: ' . $line);
            }
        }
        return ['ok' => $ok, 'fail' => $fail, 'cardIds' => $cardIds, 'orderIds' => $orderIds];
    }

    public function testNoOversellWithSingleQuantity(): void
    {
        $rounds = 30;
        $n = 8;   // 8 个并发买家
        $m = 3;   // 仅 3 张卡

        for ($r = 0; $r < $rounds; $r++) {
            $p = $this->freshProductWithCards($m);
            $res = $this->race((int) $p->id, $n, 1);

            $this->assertSame($m, $res['ok'], "第 $r 轮:应恰好 $m 单成功");
            $this->assertSame($n - $m, $res['fail'], "第 $r 轮:其余应库存不足");
            // 无一卡双占:成功订单拿到的卡全部互不相同,总数 = m
            $this->assertCount($m, array_unique($res['cardIds']), "第 $r 轮:卡被重复占用");
            $this->assertSame($m, count($res['cardIds']));
            // 库内核对
            $this->assertSame(0, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count(), "第 $r 轮:不应有剩余未售");
            $this->assertSame($m, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count());
            // 一张卡的 order_id 唯一归属
            $lockedOrders = Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->column('order_id');
            $this->assertCount($m, array_unique($lockedOrders), "第 $r 轮:存在卡被两单占用");
            // stock 缓存终值 = 未售数 = 0
            $this->assertSame(0, (int) Product::where('id', $p->id)->value('stock'));
        }
    }

    public function testQuantityTwoPartialFulfillment(): void
    {
        $rounds = 10;
        $n = 6;   // 6 个买家各要 2 张
        $cards = 5; // 仅 5 张 → 容量 floor(5/2)=2 单

        for ($r = 0; $r < $rounds; $r++) {
            $p = $this->freshProductWithCards($cards);
            $res = $this->race((int) $p->id, $n, 2);

            $this->assertSame(2, $res['ok'], "第 $r 轮:5 张卡每单 2 张应恰好成 2 单");
            $this->assertSame($n - 2, $res['fail']);
            // 共占用 4 张,互不相同(总数与去重数都为 4,杜绝"成功却占 0/重复卡")
            $this->assertSame(4, count($res['cardIds']), "第 $r 轮:成功单占用卡总数应为 4");
            $this->assertCount(4, array_unique($res['cardIds']));
            $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
            $this->assertSame(4, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count());
            $this->assertSame(1, (int) Product::where('id', $p->id)->value('stock'));
        }
    }

    /** B2 真并发:8 进程抢同一张 total=1 限量券,恰好 1 单占额成功,其余拒单;used 绝不被顶破。 */
    public function testCouponHardLimitUnderConcurrency(): void
    {
        $rounds = 10;
        $n = 8;      // 8 个并发买家
        $cards = 8;  // 卡充足(限制因素是券,不是卡)

        for ($r = 0; $r < $rounds; $r++) {
            $p = $this->freshProductWithCards($cards);
            $code = 'CONC' . $r . '_' . substr(uniqid(), -5);
            Coupon::create([
                'merchant_id' => $this->merchantId, 'code' => $code, 'type' => Coupon::TYPE_AMOUNT,
                'value' => '0.50', 'min_amount' => '0.00', 'total' => 1, 'used' => 0, 'status' => Coupon::STATUS_ON,
            ]);

            $res = $this->race((int) $p->id, $n, 1, $code);

            // 券 total=1 → 恰好 1 单占额成功,其余因"优惠券已领完"拒单
            $this->assertSame(1, $res['ok'], "第 $r 轮:券限量1应恰好1单成功");
            $this->assertSame($n - 1, $res['fail'], "第 $r 轮:其余应被券领完拒单");
            // used 精确为 1,绝不被并发顶破
            $this->assertSame(1, (int) Coupon::where('code', $code)->value('used'), "第 $r 轮:used 不得超 total");
            // 失败单不得泄漏占用卡(只有成功那 1 单锁 1 张,其余卡释放)
            $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count(), "第 $r 轮:失败单泄漏了卡");
            $this->assertSame($cards - 1, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        }
    }

    /**
     * 下单与超时释放并发:过期订单持有的卡被回收的同时,新买家来抢。
     * 不变量:旧单最终关闭;至多一个新买家拿到卡;卡绝不仍归属旧单;
     *         卡状态与库存一致(锁给新单则 stock=0,释放则 stock=1)。
     */
    public function testReclaimVsCreateConcurrency(): void
    {
        $rounds = 15;
        for ($r = 0; $r < $rounds; $r++) {
            $p = $this->freshProductWithCards(1);
            $old = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'old@x.com']);
            Db::name('orders')->where('id', $old->id)->update(['expire_at' => date('Y-m-d H:i:s', time() - 60)]);

            $startAt = microtime(true) + 0.10;
            $pids = []; $files = [];
            $workers = 5; // worker0=回收;其余=买家

            for ($i = 0; $i < $workers; $i++) {
                $file = $this->tmpDir . '/' . uniqid('rc_', true);
                $files[] = $file;
                $pid = pcntl_fork();
                if ($pid === -1) {
                    $this->fail('fork 失败');
                }
                if ($pid === 0) {
                    Db::connect('mysql', true);
                    try {
                    Db::query('SELECT 1'); // 预热连接;失败必须暴露为 ERR,不可吞掉伪装成库存不足
                } catch (\Throwable $e) {
                    file_put_contents($file, 'ERR conn ' . $e->getMessage());
                    exit(0);
                }
                    if ($startAt > microtime(true)) {
                        @time_sleep_until($startAt);
                    }
                    $out = 'ERR';
                    try {
                        if ($i === 0) {
                            $n = (new OrderService())->reclaimExpired();
                            $out = 'RECLAIM ' . $n;
                        } else {
                            $o = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'new@x.com']);
                            $out = 'BUY ' . $o->id;
                        }
                    } catch (BizException $e) {
                        $out = $i === 0 ? 'RECLAIM_BIZ' : ('BUYFAIL ' . $e->getBizCode());
                    } catch (\Throwable $e) {
                        $out = 'ERR ' . str_replace("\n", ' ', $e->getMessage());
                    }
                    file_put_contents($file, $out);
                    exit(0);
                }
                $pids[] = $pid;
            }
            foreach ($pids as $pid) {
                pcntl_waitpid($pid, $status);
            }
            Db::connect('mysql', true);

            $buyOrderIds = [];
            foreach ($files as $f) {
                $line = trim((string) @file_get_contents($f));
                @unlink($f);
                if (strpos($line, 'BUY ') === 0) {
                    $buyOrderIds[] = (int) substr($line, 4);
                } elseif (strpos($line, 'ERR') === 0) {
                    $this->fail("第 $r 轮子进程异常: $line");
                }
            }

            $this->assertSame(Order::STATUS_CLOSED, (int) Order::where('id', $old->id)->value('status'), "第 $r 轮:旧单应关闭");
            $this->assertLessThanOrEqual(1, count($buyOrderIds), "第 $r 轮:至多一个新买家成功");

            $card = Card::where('product_id', $p->id)->find();
            $this->assertNotSame((int) $old->id, (int) $card->order_id, "第 $r 轮:卡不应仍归属已关闭旧单");

            if (count($buyOrderIds) === 1) {
                $this->assertSame(Card::STATUS_LOCKED, (int) $card->status, "第 $r 轮:卡应锁给新单");
                $this->assertSame($buyOrderIds[0], (int) $card->order_id);
                $this->assertSame(0, (int) Product::where('id', $p->id)->value('stock'));
            } else {
                $this->assertSame(Card::STATUS_UNSOLD, (int) $card->status, "第 $r 轮:卡应释放回未售");
                $this->assertNull($card->order_id);
                $this->assertSame(1, (int) Product::where('id', $p->id)->value('stock'));
            }
        }
    }
}
