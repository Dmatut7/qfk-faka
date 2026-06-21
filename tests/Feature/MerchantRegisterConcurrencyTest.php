<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\service\MerchantService;
use tests\TestCase;
use think\facade\Db;

/**
 * 注册并发唯一性 (TOCTOU):同名/同邮箱并发注册时,"先查后插"之间可能被他人抢插,
 * 触发数据库唯一键冲突。此时必须映射为业务错误码而非 500。
 *
 * 两进程同时用同一 username + email 注册:
 *  - 至多一个成功(唯一索引保证不重复落库);
 *  - 失败方必须是业务错误(FAIL),绝不能是未捕获的 500(ERR)。
 */
class MerchantRegisterConcurrencyTest extends TestCase
{
    protected bool $useTransaction = false;

    private array $usernames = [];

    protected function setUp(): void
    {
        parent::setUp();
        if (!function_exists('pcntl_fork')) {
            $this->markTestSkipped('需要 pcntl 扩展');
        }
        $this->tmpDir = sys_get_temp_dir() . '/qfk_reg_' . getmypid() . '_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    private string $tmpDir = '';

    protected function tearDown(): void
    {
        foreach ($this->usernames as $u) {
            Db::name('merchants')->where('username', $u)->delete();
            Db::name('merchants')->where('email', $u . '@example.com')->delete();
        }
        if (is_dir($this->tmpDir)) {
            array_map('unlink', glob($this->tmpDir . '/*') ?: []);
            @rmdir($this->tmpDir);
        }
        parent::tearDown();
    }

    public function testConcurrentSameUsernameRegisterNoServerError(): void
    {
        $rounds = 6;
        for ($r = 0; $r < $rounds; $r++) {
            $u = 'reg_' . getmypid() . '_' . $r . '_' . uniqid();
            $this->usernames[] = $u;
            $payload = [
                'username'   => $u,
                'password'   => 'secret123',
                'store_name' => '并发店',
                'email'      => $u . '@example.com',
            ];

            $startAt = microtime(true) + 0.10;
            $pids = []; $files = [];
            for ($w = 0; $w < 2; $w++) {
                $file = $this->tmpDir . '/' . uniqid('p_', true);
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
                        (new MerchantService())->register($payload);
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

            $ok = 0; $fail = 0;
            foreach ($files as $f) {
                $line = trim((string) @file_get_contents($f));
                @unlink($f);
                if ($line === 'OK') {
                    $ok++;
                } elseif (strpos($line, 'FAIL') === 0) {
                    $fail++;
                } else {
                    $this->fail("第 $r 轮:并发注册产生未捕获错误(应为业务码而非 500): $line");
                }
            }

            // 唯一索引保证:至多一条落库
            $this->assertLessThanOrEqual(1, Merchant::where('username', $u)->count(), "第 $r 轮:同名不可重复落库");
            // 两进程合计 = 2,且并发命中冲突时必然有失败方
            $this->assertSame(2, $ok + $fail, "第 $r 轮:每个进程都应返回 OK 或业务 FAIL");
            $this->assertGreaterThanOrEqual(1, $ok, "第 $r 轮:至少一个进程注册成功");
        }
    }
}
