<?php
declare(strict_types=1);

namespace app\common;

/**
 * 业务异常:携带业务错误码,由全局异常处理器统一渲染为 {code,msg,data}。
 *
 * 用法:throw new BizException(Code::STOCK_NOT_ENOUGH, '库存不足');
 *      或 BizException::throw(Code::ORDER_PAID, '订单已支付');
 */
class BizException extends \Exception
{
    /** 业务错误码(对应 Code 常量) */
    protected int $bizCode;

    public function __construct(int $bizCode, string $message = '', ?\Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
        $this->bizCode = $bizCode;
    }

    public function getBizCode(): int
    {
        return $this->bizCode;
    }

    /**
     * @throws BizException
     */
    public static function throw(int $bizCode, string $message = ''): void
    {
        throw new self($bizCode, $message);
    }
}
