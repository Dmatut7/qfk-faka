<?php
declare(strict_types=1);

namespace app\controller;

use app\BaseController;
use think\response\Json;

/**
 * JSON API 控制器基类。
 *
 * - 统一成功/失败响应出口(success / fail)。
 * - 入参获取封装(input / params)。
 * - 校验复用 BaseController::validate()(失败抛 ValidateException,由全局处理器转 422+1001)。
 *
 * 控制器应保持"薄":取参 → 校验 → 调 Service → 返回 success/fail。
 */
abstract class BaseApiController extends BaseController
{
    /** 成功响应 */
    protected function success($data = null, string $msg = 'ok'): Json
    {
        return apiSuccess($data, $msg);
    }

    /** 失败响应(HTTP 状态按 code 映射,可覆盖) */
    protected function fail(int $code, string $msg = '', $data = null, ?int $httpStatus = null): Json
    {
        return apiError($code, $msg, $data, $httpStatus);
    }

    /** 获取单个入参 */
    protected function input(string $key, $default = null)
    {
        return $this->request->param($key, $default);
    }

    /** 仅获取指定入参键(白名单),避免越权字段注入 */
    protected function params(array $keys): array
    {
        return $this->request->only($keys);
    }
}
