<?php
declare(strict_types=1);

namespace app\util;

/**
 * 富文本 XSS 净化。商户/管理员录入、买家端 dangerouslySetInnerHTML 渲染的内容,
 * 一律在**写入时**经此白名单净化,从源头杜绝脚本注入(章节/资讯等)。
 *
 * 策略:strip_tags 仅保留排版/媒体白名单标签(script/style/iframe 等危险标签连同被移除)→
 *       再剥离所有 on* 事件属性 → 再中和 javascript:/vbscript:/data: 协议。
 */
class Html
{
    private const ALLOWED = '<p><br><hr><b><strong><i><em><u><s><h1><h2><h3><h4><h5><ul><ol><li><blockquote><pre><code><a><img><table><thead><tbody><tr><td><th><span><div>';

    public static function sanitize(?string $html): string
    {
        $html = (string) $html;
        if ($html === '') {
            return '';
        }
        // 1) 仅保留白名单标签(<script>/<style>/<iframe>/<object> 等连标签一并移除;其文本残留无害)
        $out = strip_tags($html, self::ALLOWED);
        // 2) 移除所有 on* 事件处理属性(onerror/onclick/onload …)
        $out = preg_replace('/\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $out);
        // 3) 中和危险协议(href/src 里的 javascript:/vbscript:/data:)
        $out = preg_replace_callback(
            '/\b(href|src)\s*=\s*("|\')(.*?)\2/is',
            static function ($m) {
                $val = trim($m[3]);
                if (preg_match('/^\s*(javascript|vbscript|data)\s*:/i', $val)) {
                    return $m[1] . '=' . $m[2] . '#' . $m[2];
                }
                return $m[0];
            },
            (string) $out
        );
        return (string) $out;
    }
}
