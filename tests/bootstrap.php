<?php
declare(strict_types=1);

/**
 * PHPUnit 引导文件
 *
 * 1. 加载 Composer autoload(含 autoload-dev 的 tests\ 命名空间)。
 * 2. 以 testing 环境启动 ThinkPHP 应用 —— 通过 setEnvName('testing')
 *    加载 .env.testing,使所有数据库操作落到独立的测试库 qfk_test,
 *    绝不污染开发库 qfk。
 * 3. 执行数据库迁移(幂等),保证测试库结构为最新。
 *
 * 启动后的 App 实例通过 $GLOBALS 共享给 tests\TestCase 基类。
 */

use think\App;
use think\facade\Console;

require __DIR__ . '/../vendor/autoload.php';

// 测试环境提供下载签名密钥(生产读真实环境变量;DownloadService 不再回退硬编码盐)
putenv('DOWNLOAD_SECRET=test_download_secret_for_phpunit');

$app = new App();
$app->setEnvName('testing');
$app->initialize();

// 安全护栏:测试必须运行在测试库上,防止误连开发/生产库
$dbName = $app->config->get('database.connections.mysql.database');
if ($dbName !== 'qfk_test') {
    fwrite(STDERR, "[bootstrap] 拒绝运行:期望测试库 qfk_test,实际为 '{$dbName}'。\n");
    exit(1);
}

// 同步测试库结构(仅执行未运行的迁移,幂等)
try {
    Console::call('migrate:run');
} catch (\Throwable $e) {
    fwrite(STDERR, '[bootstrap] migrate:run 警告: ' . $e->getMessage() . "\n");
}

$GLOBALS['__think_test_app'] = $app;
