<?php
declare(strict_types=1);

namespace app\controller;

use think\facade\App;
use think\facade\Db;
use think\response\Json;

/**
 * 健康检查接口
 *
 * 用于负载均衡 / 监控系统探活,并检测基础依赖(数据库)连通性。
 * 不依赖任何业务表,仅执行 `SELECT 1`。
 */
class Health
{
    public function index(): Json
    {
        $database = 'ok';
        try {
            Db::query('SELECT 1');
        } catch (\Throwable $e) {
            $database = 'down';
        }

        return json([
            'code' => 0,
            'msg'  => 'ok',
            'data' => [
                'status'    => 'ok',
                'service'   => 'qfk-faka',
                'php'       => PHP_VERSION,
                'framework' => App::version(),
                'database'  => $database,
                'timestamp' => time(),
            ],
        ]);
    }
}
