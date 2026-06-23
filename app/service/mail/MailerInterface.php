<?php
declare(strict_types=1);

namespace app\service\mail;

/**
 * 邮件发送抽象。生产用 SmtpMailer;测试注入 RecordingMailer。
 * 约定:发送失败抛异常,由调用方(DeliveryMailService)统一吞掉(fire-and-forget)。
 */
interface MailerInterface
{
    /**
     * 发送一封 HTML 邮件。
     *
     * @param string $to      收件人邮箱
     * @param string $subject 主题
     * @param string $html    HTML 正文
     * @return bool 发送成功
     */
    public function send(string $to, string $subject, string $html): bool;
}
