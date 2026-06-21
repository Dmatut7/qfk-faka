<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\controller\BaseApiController;
use tests\TestCase;
use think\exception\ValidateException;

/**
 * 具体子类,用于在不依赖路由的情况下测试基类能力。
 */
class _FakeApiController extends BaseApiController
{
    public function ok()
    {
        return $this->success(['a' => 1], 'done');
    }

    public function bad()
    {
        return $this->fail(Code::BUY_LIMIT, '超出限购');
    }

    public function picked()
    {
        return $this->success($this->params(['name', 'age']));
    }

    public function single()
    {
        return $this->success($this->input('q', 'def'));
    }

    public function mustValidate()
    {
        $this->validate($this->params(['name']), ['name' => 'require|max:8']);
        return $this->success('valid');
    }
}

/**
 * API 基类控制器 (T1.3)。
 */
class BaseApiControllerTest extends TestCase
{
    protected bool $useTransaction = false;

    private function controllerWith(array $get = []): _FakeApiController
    {
        $req = $this->app->make('request', [], true);
        $req->withGet($get);
        $this->app->instance('request', $req);
        return new _FakeApiController($this->app);
    }

    public function testSuccessHelper(): void
    {
        $resp = $this->controllerWith()->ok();
        $this->assertSame(200, $resp->getCode());
        $body = json_decode($resp->getContent(), true);
        $this->assertSame(0, $body['code']);
        $this->assertSame('done', $body['msg']);
        $this->assertSame(['a' => 1], $body['data']);
    }

    public function testFailHelper(): void
    {
        $resp = $this->controllerWith()->bad();
        $body = json_decode($resp->getContent(), true);
        $this->assertSame(Code::BUY_LIMIT, $body['code']);
        $this->assertSame('超出限购', $body['msg']);
    }

    public function testParamsWhitelist(): void
    {
        $resp = $this->controllerWith(['name' => 'Tom', 'age' => '9', 'evil' => 'x'])->picked();
        $body = json_decode($resp->getContent(), true);
        // 只取白名单字段,evil 被丢弃
        $this->assertSame('Tom', $body['data']['name']);
        $this->assertSame('9', $body['data']['age']);
        $this->assertArrayNotHasKey('evil', $body['data']);
    }

    public function testInputDefault(): void
    {
        $this->assertSame('def', json_decode($this->controllerWith()->single()->getContent(), true)['data']);
        $this->assertSame('hi', json_decode($this->controllerWith(['q' => 'hi'])->single()->getContent(), true)['data']);
    }

    public function testValidatePasses(): void
    {
        $resp = $this->controllerWith(['name' => 'ok'])->mustValidate();
        $this->assertSame('valid', json_decode($resp->getContent(), true)['data']);
    }

    public function testValidateThrows(): void
    {
        $this->expectException(ValidateException::class);
        $this->controllerWith(['name' => 'this_name_is_way_too_long'])->mustValidate();
    }
}
