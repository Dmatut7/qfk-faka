<?php
namespace app;

use app\common\BizException;
use app\common\Code;
use think\db\exception\DataNotFoundException;
use think\db\exception\ModelNotFoundException;
use think\exception\Handle;
use think\exception\HttpException;
use think\exception\HttpResponseException;
use think\exception\ValidateException;
use think\Response;
use Throwable;

/**
 * 应用异常处理类
 */
class ExceptionHandle extends Handle
{
    /**
     * 不需要记录信息（日志）的异常类列表
     * @var array
     */
    protected $ignoreReport = [
        HttpException::class,
        HttpResponseException::class,
        ModelNotFoundException::class,
        DataNotFoundException::class,
        ValidateException::class,
    ];

    /**
     * 记录异常信息（包括日志或者其它方式记录）
     *
     * @access public
     * @param  Throwable $exception
     * @return void
     */
    public function report(Throwable $exception): void
    {
        // 使用内置的方式记录异常日志
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @access public
     * @param \think\Request   $request
     * @param Throwable $e
     * @return Response
     */
    public function render($request, Throwable $e): Response
    {
        // 业务异常:携带业务码,按映射返回统一 JSON
        if ($e instanceof BizException) {
            return apiError($e->getBizCode(), $e->getMessage() ?: 'error');
        }

        // 参数校验异常 → 422 + 1001
        if ($e instanceof ValidateException) {
            return apiError(Code::PARAM_ERROR, $e->getMessage());
        }

        // 资源不存在 → 404 + 1002
        if ($e instanceof ModelNotFoundException || $e instanceof DataNotFoundException) {
            return apiError(Code::NOT_FOUND, '资源不存在');
        }

        // HTTP 异常(含未匹配路由的 404)→ 统一结构,保留原状态码
        if ($e instanceof HttpException) {
            $status = $e->getStatusCode();
            if ($status === 404) {
                return apiError(Code::NOT_FOUND, '资源不存在');
            }
            return apiError(Code::STATE_INVALID, $e->getMessage() ?: 'HTTP error', null, $status);
        }

        // 兜底:服务器错误 → 500(调试模式暴露原始信息便于定位)
        $message = $this->app->isDebug() ? $e->getMessage() : '服务器繁忙,请稍后再试';
        return apiError(Code::SERVER_ERROR, $message, null, 500);
    }
}
