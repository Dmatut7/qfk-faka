<?php
declare(strict_types=1);

namespace app\util;

/**
 * 富文本 XSS 净化。商户/管理员录入、买家端 dangerouslySetInnerHTML 渲染的内容,
 * 一律在**写入时**经此白名单净化,从源头杜绝脚本注入(章节/资讯等)。
 *
 * 策略:strip_tags 仅保留排版/媒体白名单标签(script/style/iframe 等危险标签连同被移除)→
 *       再剥离所有 on* 事件属性 → 再对 href/src 做**协议白名单**(仅 http/https/mailto/tel 与相对路径)。
 * 协议判定:对带/不带引号的属性值,先 html_entity_decode 并去除协议中可插入的空白/控制符,
 *           再提取 scheme 比对白名单——杜绝「无引号 javascript:」「实体编码 java&#115;cript:」等绕过。
 */
class Html
{
    private const ALLOWED = '<p><br><hr><b><strong><i><em><u><s><h1><h2><h3><h4><h5><ul><ol><li><blockquote><pre><code><a><img><table><thead><tbody><tr><td><th><span><div>';

    /** href/src 允许的协议白名单;其余(javascript/vbscript/data/file…)一律中和 */
    private const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];

    public static function sanitize(?string $html): string
    {
        $html = (string) $html;
        if ($html === '') {
            return '';
        }
        // 1) 仅保留白名单标签(<script>/<style>/<iframe>/<object> 等连标签一并移除;其文本残留无害)
        $out = strip_tags($html, self::ALLOWED);
        // 2) 移除所有 on* 事件处理属性(onerror/onclick/onload …)
        $out = (string) preg_replace('/\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $out);
        // 3) href/src 协议白名单(覆盖带/不带引号;先实体解码+去控制符再判,防绕过)
        $out = (string) preg_replace_callback(
            '/\b(href|src)\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i',
            static function ($m) {
                $raw = $m[2];
                $val = (strlen($raw) >= 2 && ($raw[0] === '"' || $raw[0] === "'")) ? substr($raw, 1, -1) : $raw;
                $check = strtolower(html_entity_decode($val, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $check = (string) preg_replace('/[\x00-\x20]+/', '', $check); // 去掉协议中插入的空白/控制符
                if (preg_match('/^([a-z][a-z0-9+.\-]*):/', $check, $sm)
                    && !in_array($sm[1], self::SAFE_SCHEMES, true)) {
                    return $m[1] . '="#"'; // 非白名单协议(含相对路径外的任何 scheme)→ 中和
                }
                return $m[0];
            },
            $out
        );
        return $out;
    }
}
