<?php
declare(strict_types=1);

namespace tests;

use PHPUnit\Framework\TestCase as BaseTestCase;
use think\App;
use think\facade\Db;
use think\Response;

/**
 * 测试基类
 *
 * - 复用 bootstrap 启动的、指向测试库的共享 App 实例。
 * - 默认将每个测试用例包裹在数据库事务中并在结束时回滚,保证用例间隔离、
 *   不残留脏数据(并发类测试需将 $useTransaction 置为 false 自行清理)。
 * - 提供模拟 HTTP 请求的辅助方法,便于对控制器/路由做集成测试。
 */
abstract class TestCase extends BaseTestCase
{
    protected App $app;

    /**
     * 是否将测试包裹在事务中并在 tearDown 回滚。
     * 涉及真实并发(多连接、行锁)的测试需置为 false。
     */
    protected bool $useTransaction = true;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app = $GLOBALS['__think_test_app'];

        if ($this->useTransaction) {
            Db::startTrans();
        }
    }

    protected function tearDown(): void
    {
        if ($this->useTransaction) {
            Db::rollback();
        }
        parent::tearDown();
    }

    /**
     * 发起一次模拟 HTTP 请求,返回框架 Response 对象。
     */
    protected function call(string $method, string $uri, array $params = [], array $headers = [], array $server = []): Response
    {
        $method = strtoupper($method);
        $path   = parse_url($uri, PHP_URL_PATH) ?: $uri;
        $path   = ltrim($path, '/');

        /** @var \think\Request $request */
        $request = $this->app->make('request', [], true);
        $request->setMethod($method);
        $request->setPathinfo($path);
        $request->withServer(array_merge($_SERVER, ['REQUEST_METHOD' => $method], $server));

        if ($headers) {
            // withServer 不会重建 header,需显式注入(键小写,如 authorization)
            $request->withHeader($headers);
        }

        if ($method === 'GET') {
            $request->withGet($params);
        } else {
            $request->withPost($params);
        }

        // 单进程内多次 Http::run 会让路由/中间件队列累积(生产环境每请求独立进程)。
        // 每次请求前重置 route 与 middleware,模拟请求隔离;不触碰 Db(事务保持)。
        $this->app->instance('route', new \think\Route($this->app));
        $this->app->instance('middleware', new \think\Middleware($this->app));

        return $this->app->http->run($request);
    }

    /** 带 Bearer 令牌的请求头便捷构造 */
    protected function bearer(string $token): array
    {
        return ['authorization' => 'Bearer ' . $token];
    }

    /**
     * 发起请求并将 JSON 响应体解码为数组。
     */
    protected function callJson(string $method, string $uri, array $params = [], array $headers = [], array $server = []): array
    {
        $response = $this->call($method, $uri, $params, $headers, $server);
        return json_decode($response->getContent(), true) ?: [];
    }
}
