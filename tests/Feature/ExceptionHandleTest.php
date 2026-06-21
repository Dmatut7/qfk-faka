<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\ExceptionHandle;
use tests\TestCase;
use think\exception\ValidateException;

/**
 * 全局异常处理 (T1.2):各类异常 → 统一 {code,msg,data} + 正确 HTTP 状态。
 */
class ExceptionHandleTest extends TestCase
{
    protected bool $useTransaction = false;

    private function render(\Throwable $e): \think\Response
    {
        $handler = new ExceptionHandle($this->app);
        $request = $this->app->make('request');
        return $handler->render($request, $e);
    }

    public function testBizExceptionBusinessCodeDefaults200(): void
    {
        $resp = $this->render(new BizException(Code::STOCK_NOT_ENOUGH, '库存不足'));
        $this->assertSame(200, $resp->getCode());
        $body = json_decode($resp->getContent(), true);
        $this->assertSame(3002, $body['code']);
        $this->assertSame('库存不足', $body['msg']);
    }

    public function testBizExceptionMapsToHttp404(): void
    {
        $resp = $this->render(new BizException(Code::ORDER_NOT_FOUND, '订单不存在'));
        $this->assertSame(404, $resp->getCode());
        $this->assertSame(4001, json_decode($resp->getContent(), true)['code']);
    }

    public function testValidateExceptionMapsTo422(): void
    {
        $resp = $this->render(new ValidateException('用户名必填'));
        $this->assertSame(422, $resp->getCode());
        $body = json_decode($resp->getContent(), true);
        $this->assertSame(Code::PARAM_ERROR, $body['code']);
        $this->assertSame('用户名必填', $body['msg']);
    }

    public function testGenericExceptionMapsTo500(): void
    {
        $resp = $this->render(new \RuntimeException('boom'));
        $this->assertSame(500, $resp->getCode());
        $this->assertSame(Code::SERVER_ERROR, json_decode($resp->getContent(), true)['code']);
    }

    public function testUnknownRouteReturnsJson404(): void
    {
        $resp = $this->call('GET', '/definitely-no-such-route-xyz');
        $this->assertSame(404, $resp->getCode());
        $body = json_decode($resp->getContent(), true);
        $this->assertIsArray($body);
        $this->assertSame(Code::NOT_FOUND, $body['code']);
    }

    public function testBizExceptionThrowHelper(): void
    {
        try {
            BizException::throw(Code::ORDER_PAID, '订单已支付');
            $this->fail('should have thrown');
        } catch (BizException $e) {
            $this->assertSame(Code::ORDER_PAID, $e->getBizCode());
            $this->assertSame('订单已支付', $e->getMessage());
        }
    }
}
