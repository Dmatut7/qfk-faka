<?php
// 应用公共文件

use app\common\Code;
use think\response\Json;

if (!function_exists('apiSuccess')) {
    /**
     * 统一成功响应:{code:0, msg, data}。
     *
     * @param mixed  $data
     * @param string $msg
     */
    function apiSuccess($data = null, string $msg = 'ok'): Json
    {
        return json(['code' => Code::SUCCESS, 'msg' => $msg, 'data' => $data], 200);
    }
}

if (!function_exists('apiError')) {
    /**
     * 统一失败响应:{code, msg, data}。
     * HTTP 状态默认按错误码映射(见 Code::httpStatus),可显式覆盖。
     *
     * @param int      $code       业务错误码
     * @param string   $msg        可读错误信息
     * @param mixed    $data
     * @param int|null $httpStatus 显式 HTTP 状态(为空则按 code 映射)
     */
    function apiError(int $code, string $msg = '', $data = null, ?int $httpStatus = null): Json
    {
        $status = $httpStatus ?? Code::httpStatus($code);
        return json(['code' => $code, 'msg' => $msg, 'data' => $data], $status);
    }
}
