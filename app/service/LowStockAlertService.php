<?php
declare(strict_types=1);

namespace app\service;

use app\model\Merchant;
use app\model\Product;
use app\service\mail\MailerFactory;
use app\service\mail\MailerInterface;
use think\facade\Log;

/**
 * 库存预警:卡密库存跌破阈值时邮件提醒商户补货(对标开源卡网「库存不足通知」)。
 *
 * 触发:stock:reconcile 重算库存后调用,库存数据最新。只处理**自动发卡**(有真实卡池)
 *       的**在售**商品——手动发货商品无卡池,stock 恒为 0,纳入会持续误报。
 * 去重:products.low_stock_notified 标记「已发过」;补货回升超过阈值后清零再武装,
 *       避免每轮 cron 重复轰炸同一商户。阈值 low_stock_threshold≤0 时整体关闭。
 * fire-and-forget:单商品发信失败只记日志、保留未通知态以便下轮重试,
 *       不影响其余商品与对账主流程。
 */
class LowStockAlertService
{
    private static ?MailerInterface $testMailer = null;

    /** 测试钩子:注入 mailer(非 null 时绕过 SMTP 配置门控);传 null 复位。 */
    public static function setTestMailer(?MailerInterface $mailer): void
    {
        self::$testMailer = $mailer;
    }

    /**
     * 扫描并处理低库存预警。返回实际发出的预警邮件数。
     * @param callable|null $log 可选行级日志回调(命令行输出用)。
     */
    public function run(?callable $log = null): int
    {
        $setting   = new SettingService();
        $threshold = (int) $setting->get('low_stock_threshold', '0');
        if ($threshold <= 0) {
            return 0; // 未开启
        }

        // mailer 为 null(未配 SMTP)时无法发信:此时连「置位」也不做,
        // 保持纯关闭语义(配置好 SMTP 后首轮即可正常预警),仅照常处理回升清零。
        $mailer = self::$testMailer ?: MailerFactory::fromSettings($setting);
        $site   = (string) ($setting->get('site_title', '') ?: '发卡平台');
        $sent   = 0;

        Product::where('type', Product::TYPE_AUTO)
            ->where('status', Product::STATUS_ON)
            ->field(['id', 'merchant_id', 'title', 'stock', 'low_stock_notified'])
            ->chunk(500, function ($products) use ($threshold, $mailer, $site, &$sent, $log) {
                foreach ($products as $p) {
                    $low      = (int) $p->stock <= $threshold;
                    $notified = (int) $p->low_stock_notified === 1;

                    if ($low && !$notified) {
                        // 跌破阈值且未通知过 → 发信成功才置位(失败保留 0,下轮重试)
                        if ($mailer && $this->alertOne($mailer, $p, $threshold, $site, $log)) {
                            Product::where('id', $p->id)->update(['low_stock_notified' => 1]);
                            $sent++;
                        }
                    } elseif (!$low && $notified) {
                        // 回升超过阈值 → 清零再武装
                        Product::where('id', $p->id)->update(['low_stock_notified' => 0]);
                        if ($log) {
                            $log("[low-stock] product #{$p->id} restocked ({$p->stock} > {$threshold}), re-armed");
                        }
                    }
                }
            });

        return $sent;
    }

    /** 给单个商品的商户发预警邮件。成功 true,地址无效/异常 false(由调用方决定是否置位)。 */
    private function alertOne(MailerInterface $mailer, Product $p, int $threshold, string $site, ?callable $log): bool
    {
        try {
            $merchant = Merchant::find((int) $p->merchant_id);
            $email    = $merchant ? trim((string) $merchant->email) : '';
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return false;
            }
            [$subject, $body] = $this->compose($p, $threshold, $site, $merchant);
            $mailer->send($email, $subject, $body);
            if ($log) {
                $log("[low-stock] alerted merchant #{$p->merchant_id} for product #{$p->id} (stock {$p->stock} <= {$threshold})");
            }
            return true;
        } catch (\Throwable $e) {
            Log::error('[low-stock] 预警发送失败 product#' . $p->id . ': ' . $e->getMessage());
            return false;
        }
    }

    /** 组装预警邮件主题与 HTML 正文。 */
    private function compose(Product $p, int $threshold, string $site, Merchant $merchant): array
    {
        $title = (string) $p->title;
        $store = (string) ($merchant->store_name ?: $merchant->username ?: '商户');
        $stock = (int) $p->stock;

        $subject = "【{$site}】库存预警:商品「{$title}」仅剩 {$stock} 件";
        $esc = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
        $body = '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">'
              . '<h2 style="font-size:18px;">库存不足提醒</h2>'
              . '<p>' . $esc($store) . ',您好:</p>'
              . '<p>您的商品 <b>' . $esc($title) . '</b>(#' . (int) $p->id . ')剩余可售卡密 '
              . '<b style="color:#FF5000;">' . $stock . '</b> 件,已低于预警阈值 ' . $threshold . ' 件。</p>'
              . '<p>请尽快在商户后台为该商品导入新卡密,以免影响销售。</p>'
              . '<p style="color:#9ca3af;font-size:12px;margin-top:16px;">本邮件由系统自动发送,补货回升后将自动恢复监控。— ' . $esc($site) . '</p>'
              . '</div>';

        return [$subject, $body];
    }
}
