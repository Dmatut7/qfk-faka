<?php
declare(strict_types=1);

namespace tests\Unit;

use app\common\Code;
use tests\TestCase;

/**
 * 统一响应助手与错误码 (T1.1)。
 */
class CommonResponseTest extends TestCase
{
    protected bool $useTransaction = false;

    public function testCodeConstants(): void
    {
        $this->assertSame(0, Code::SUCCESS);
        $this->assertSame(1001, Code::PARAM_ERROR);
        $this->assertSame(2001, Code::UNAUTHORIZED);
        $this->assertSame(3002, Code::STOCK_NOT_ENOUGH);
        $this->assertSame(4004, Code::AMOUNT_MISMATCH);
        $this->assertSame(4005, Code::ORDER_EXCEPTION);
        $this->assertSame(5001, Code::SIGN_INVALID);
        $this->assertSame(5004, Code::PAYMENT_OWNERSHIP);
    }

    public function testHttpStatusMapping(): void
    {
        $this->assertSame(200, Code::httpStatus(Code::SUCCESS));
        $this->assertSame(422, Code::httpStatus(Code::PARAM_ERROR));
        $this->assertSame(404, Code::httpStatus(Code::NOT_FOUND));
        $this->assertSame(404, Code::httpStatus(Code::ORDER_NOT_FOUND));
        $this->assertSame(401, Code::httpStatus(Code::UNAUTHORIZED));
        $this->assertSame(403, Code::httpStatus(Code::FORBIDDEN));
        // 普通业务错误默认 200(错误体现在 body.code)
        $this->assertSame(200, Code::httpStatus(Code::STOCK_NOT_ENOUGH));
    }

    public function testApiSuccess(): void
    {
        $resp = apiSuccess(['x' => 1], 'done');
        $this->assertSame(200, $resp->getCode());

        $body = json_decode($resp->getContent(), true);
        $this->assertSame(0, $body['code']);
        $this->assertSame('done', $body['msg']);
        $this->assertSame(['x' => 1], $body['data']);
    }

    public function testApiErrorMapsHttpStatus(): void
    {
        $resp = apiError(Code::PARAM_ERROR, '参数错误');
        $this->assertSame(422, $resp->getCode());

        $body = json_decode($resp->getContent(), true);
        $this->assertSame(1001, $body['code']);
        $this->assertSame('参数错误', $body['msg']);
        $this->assertNull($body['data']);
    }

    public function testApiErrorAuthIs401(): void
    {
        $this->assertSame(401, apiError(Code::UNAUTHORIZED, '未登录')->getCode());
    }

    public function testApiErrorExplicitHttpStatusOverride(): void
    {
        $resp = apiError(Code::STOCK_NOT_ENOUGH, '库存不足', null, 200);
        $this->assertSame(200, $resp->getCode());
        $this->assertSame(3002, json_decode($resp->getContent(), true)['code']);
    }
}
