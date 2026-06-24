<?php
declare(strict_types=1);

namespace app\service\mail;

use app\service\SettingService;

/**
 * 据平台 SMTP 设置构建 mailer。多处通知(发货邮件、库存预警)共用,避免重复读配置。
 * 未配置 smtp_host 返回 null(调用方据此静默跳过)。
 */
class MailerFactory
{
    public static function fromSettings(SettingService $s): ?MailerInterface
    {
        $host = trim((string) $s->get('smtp_host', ''));
        if ($host === '') {
            return null;
        }
        $user = (string) $s->get('smtp_user', '');
        return new SmtpMailer(
            $host,
            (int) ((string) $s->get('smtp_port', '465') ?: '465'),
            $user,
            (string) $s->get('smtp_pass', ''),
            (string) ($s->get('smtp_from', '') ?: $user),
            (string) ($s->get('smtp_secure', 'ssl') ?: 'ssl')
        );
    }
}
