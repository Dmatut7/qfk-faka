<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\NotifyService;
use app\service\OrderService;
use app\util\OrderNo;
use tests\TestCase;
use think\facade\Db;

/**
 * 支付回调幂等的【真实并发】验证 (T6.5):同一笔成功回调被多进程同时投递,
 * 只能发货一次、只能结算一次,卡密绝不被重复消耗。
 */
class PaymentNotifyConcurrencyTest extends TestCase
{
    private const KEY = 'secretkey';

    protected bool $useTransaction = false;

    private int $merchantId = 0;
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        if (!function_exists('pcntl_fork')) {
            $this->markTestSkipped('需要 pcntl 扩展');
        }
        $this->merchantId = (int) $this->makeMerchant()->id; // commission_rate 默认 0 → 入账=总额
        if (!PaymentChannel::where('code', 'epay')->find()) {
            PaymentChannel::create([
                'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
                'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
                'status' => PaymentChannel::STATUS_ENABLED,
            ]);
        }
        $this->tmpDir = sys_get_temp_dir() . '/qfk_notify_' . getmypid() . '_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        if ($this->merchantId) {
            $pids = Product::where('merchant_id', $this->merchantId)->column('id');
            Db::name('merchant_fund_logs')->where('merchant_id', $this->merchantId)->delete();
            Db::name('payments')->where('merchant_id', $this->merchantId)->delete();
            Db::name('cards')->where('merchant_id', $this->merchantId)->delete();
            Db::name('orders')->where('merchant_id', $this->merchantId)->delete();
            if ($pids) {
                Db::name('products')->whereIn('id', $pids)->delete();
            }
            Db::name('merchants')->where('id', $this->merchantId)->delete();
        }
        Db::name('payment_channels')->where('code', 'epay')->delete();
        if (is_dir($this->tmpDir)) {
            array_map('unlink', glob($this->tmpDir . '/*') ?: []);
            @rmdir($this->tmpDir);
        }
        parent::tearDown();
    }

    private function epaySign(array $params, string $key): string
    {
        unset($params['sign'], $params['sign_type']);
        $params = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($params);
        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        return md5(implode('&', $parts) . $key);
    }

    public function testConcurrentDuplicateCallbacksDeliverOnce(): void
    {
        $rounds = 8;
        $workers = 6;

        for ($r = 0; $r < $rounds; $r++) {
            // 提交态准备:商品 + 2 卡 + 订单(预占)+ 支付单
            $p = Product::create(['merchant_id' => $this->merchantId, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
            $rows = [];
            $now = date('Y-m-d H:i:s');
            for ($i = 0; $i < 2; $i++) {
                $s = "NC{$r}-{$i}";
                $rows[] = ['merchant_id' => $this->merchantId, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s), 'status' => Card::STATUS_UNSOLD, 'create_time' => $now, 'update_time' => $now];
            }
            Card::insertAll($rows);
            Db::name('products')->where('id', $p->id)->update(['stock' => 2]);
            $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']); // total 20.00
            $payment = Payment::create([
                'payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id,
                'merchant_id' => $this->merchantId, 'channel' => 'epay', 'amount' => '20.00', 'status' => Payment::STATUS_PENDING,
            ]);

            $cb = [
                'pid' => '1001', 'out_trade_no' => $payment->payment_no, 'trade_no' => 'CH_' . $r,
                'money' => '20.00', 'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
            ];
            $cb['sign'] = $this->epaySign($cb, self::KEY);
            $cb['sign_type'] = 'MD5';

            $startAt = microtime(true) + 0.10;
            $pidsArr = []; $files = [];
            for ($w = 0; $w < $workers; $w++) {
                $file = $this->tmpDir . '/' . uniqid('n_', true);
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
                        $res = (new NotifyService())->handle('epay', $cb);
                        file_put_contents($file, $res['ack'] . ' ' . ($res['delivered'] ? '1' : '0'));
                    } catch (\Throwable $e) {
                        file_put_contents($file, 'ERR ' . str_replace("\n", ' ', $e->getMessage()));
                    }
                    exit(0);
                }
                $pidsArr[] = $pid;
            }
            foreach ($pidsArr as $pid) {
                pcntl_waitpid($pid, $status);
            }
            Db::connect('mysql', true);

            $deliveredCount = 0;
            foreach ($files as $f) {
                $line = trim((string) @file_get_contents($f));
                @unlink($f);
                if (strpos($line, 'success') === 0) {
                    if (substr($line, -1) === '1') {
                        $deliveredCount++;
                    }
                } else {
                    $this->fail("第 $r 轮:回调异常 $line");
                }
            }

            // 恰好一次发货
            $this->assertSame(1, $deliveredCount, "第 $r 轮:只能有一个进程真正发货");
            $this->assertSame(Order::STATUS_DELIVERED, (int) Order::where('id', $order->id)->value('status'));
            $this->assertSame(2, Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->count(), "卡密不得被重复消耗");
            // 只结算一次:余额=总额(佣金0),流水恰好 2 条
            $this->assertSame('20.00', (string) Merchant::where('id', $this->merchantId)->value('balance'), "第 $r 轮:余额不得重复入账");
            $this->assertSame(2, MerchantFundLog::where('order_id', $order->id)->count(), "结算流水不得重复");

            // 清理本轮余额,避免跨轮累加干扰
            Db::name('merchants')->where('id', $this->merchantId)->update(['balance' => '0.00']);
        }
    }
}
