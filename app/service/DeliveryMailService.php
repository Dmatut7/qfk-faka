<?php
declare(strict_types=1);

namespace app\service;

use app\model\Order;
use app\service\mail\MailerFactory;
use app\service\mail\MailerInterface;
use think\facade\Log;

/**
 * 发货后给买家发邮件通知(参考开源卡网:付款发卡后邮件送达卡密/取卡链接)。
 *
 * 关键约束:**fire-and-forget** —— 任何异常一律吞掉并记日志,绝不影响发货主流程。
 * 配置经平台设置:notify_on_deliver 开关 + smtp_host/port/user/pass/from/secure。
 * 未开启或未配置 SMTP 时静默跳过。测试可经 setTestMailer 注入录制 mailer 绕过配置门控。
 */
class DeliveryMailService
{
    private static ?MailerInterface $testMailer = null;

    /** 测试钩子:注入 mailer(非 null 时绕过配置门控直接使用);传 null 复位。 */
    public static function setTestMailer(?MailerInterface $mailer): void
    {
        self::$testMailer = $mailer;
    }

    /**
     * 发货成功后调用(应在发货事务提交后、主流程之外调用)。
     * 永不抛异常。
     */
    public function notifyDelivered(Order $order): void
    {
        try {
            $email = trim((string) $order->buyer_email);
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return;
            }

            $setting = new SettingService();
            $mailer  = self::$testMailer ?: $this->buildMailer($setting);
            if ($mailer === null) {
                return; // 未开启 / 未配置 SMTP
            }

            [$subject, $body] = $this->compose($order, $setting);
            $mailer->send($email, $subject, $body);
        } catch (\Throwable $e) {
            // fire-and-forget:绝不影响发货
            Log::error('[deliver-mail] 通知发送失败: ' . $e->getMessage());
        }
    }

    /** 据平台配置构建 SMTP mailer;未开启发货通知或缺 host 返回 null。 */
    private function buildMailer(SettingService $setting): ?MailerInterface
    {
        if ((string) $setting->get('notify_on_deliver', '0') !== '1') {
            return null;
        }
        return MailerFactory::fromSettings($setting);
    }

    /** 组装通知邮件主题与 HTML 正文(含订单号 + 发货内容/卡密)。 */
    private function compose(Order $order, SettingService $setting): array
    {
        $site    = (string) ($setting->get('site_title', '') ?: '发卡平台');
        $no      = (string) $order->order_no;
        $content = (string) $order->delivered_content;

        $subject = "【{$site}】订单 {$no} 已发货";
        $safe    = nl2br(htmlspecialchars($content, ENT_QUOTES, 'UTF-8'));
        $body = '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">'
              . '<h2 style="font-size:18px;">您的订单已发货</h2>'
              . '<p>订单号:<b>' . htmlspecialchars($no, ENT_QUOTES, 'UTF-8') . '</b></p>'
              . '<p>以下为您购买的卡密 / 发货内容,请妥善保存:</p>'
              . '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;'
              . 'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;line-height:1.7;word-break:break-all;">'
              . $safe . '</div>'
              . '<p style="color:#6b7280;font-size:13px;margin-top:16px;">'
              . '如内容显示不全,可凭<b>订单号 + 下单邮箱</b>在站内「订单查询」页随时查看。本邮件由系统自动发送。</p>'
              . '<p style="color:#9ca3af;font-size:12px;">— ' . htmlspecialchars($site, ENT_QUOTES, 'UTF-8') . '</p>'
              . '</div>';

        return [$subject, $body];
    }
}
