<?php
declare(strict_types=1);

namespace tests\Support;

use app\service\mail\MailerInterface;
use RuntimeException;

/** 测试替身:send 总是抛异常,用于验证发货主流程的 fire-and-forget 隔离。 */
class ThrowingMailer implements MailerInterface
{
    public function send(string $to, string $subject, string $html): bool
    {
        throw new RuntimeException('SMTP boom (test)');
    }
}
