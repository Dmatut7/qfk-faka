<?php
declare(strict_types=1);

namespace app\common;

/**
 * 全局业务错误码 + HTTP 状态映射。
 *
 * 约定见 docs/spec.md §1.4。`code=0` 成功;非 0 为业务错误码。
 * 未特别映射的业务错误返回 HTTP 200(错误体现在 body.code),
 * 鉴权/参数/不存在类按 REST 语义映射到 401/403/404/422。
 */
class Code
{
    public const SUCCESS = 0;

    public const SERVER_ERROR = 500; // 服务器内部错误

    // 1xxx 通用 / 参数
    public const PARAM_ERROR   = 1001; // 参数校验失败
    public const NOT_FOUND     = 1002; // 资源不存在
    public const STATE_INVALID = 1003; // 状态非法

    // 2xxx 鉴权
    public const UNAUTHORIZED  = 2001; // 未登录
    public const TOKEN_INVALID = 2002; // token 失效
    public const FORBIDDEN     = 2003; // 无权限

    // 3xxx 商品 / 卡密
    public const PRODUCT_OFF      = 3001; // 商品下架
    public const STOCK_NOT_ENOUGH = 3002; // 库存不足
    public const BUY_LIMIT        = 3003; // 超出限购

    // 4xxx 订单
    public const ORDER_NOT_FOUND = 4001; // 订单不存在
    public const ORDER_PAID      = 4002; // 订单已支付
    public const ORDER_CLOSED    = 4003; // 订单已关闭 / 过期
    public const AMOUNT_MISMATCH = 4004; // 金额不符
    public const ORDER_EXCEPTION = 4005; // 订单异常待人工

    // 5xxx 支付
    public const SIGN_INVALID        = 5001; // 验签失败
    public const CHANNEL_UNAVAILABLE = 5002; // 渠道不可用
    public const DUPLICATE_NOTIFY    = 5003; // 重复回调-已处理
    public const PAYMENT_OWNERSHIP   = 5004; // 支付单归属校验失败

    /**
     * 业务错误码 → HTTP 状态码。
     */
    public static function httpStatus(int $code): int
    {
        switch ($code) {
            case self::SUCCESS:
                return 200;
            case self::SERVER_ERROR:
                return 500;
            case self::PARAM_ERROR:
            case self::STATE_INVALID:
                return 422;
            case self::NOT_FOUND:
            case self::ORDER_NOT_FOUND:
                return 404;
            case self::UNAUTHORIZED:
            case self::TOKEN_INVALID:
                return 401;
            case self::FORBIDDEN:
            case self::PAYMENT_OWNERSHIP:
                return 403;
            default:
                return 200;
        }
    }
}
