<?php
declare(strict_types=1);

namespace tests\Unit;

use app\util\Html;
use PHPUnit\Framework\TestCase;

/**
 * 富文本 XSS 净化:剥离脚本/事件/危险协议,保留排版标签。
 */
class HtmlSanitizeTest extends TestCase
{
    public function testStripsScriptTag(): void
    {
        $out = Html::sanitize('<p>正文</p><script>steal(document.cookie)</script>');
        $this->assertStringNotContainsString('<script', $out);
        $this->assertStringContainsString('<p>正文</p>', $out);
    }

    public function testStripsEventHandlers(): void
    {
        $out = Html::sanitize('<img src="x" onerror="alert(1)"><div onclick="x()">hi</div>');
        $this->assertStringNotContainsString('onerror', $out);
        $this->assertStringNotContainsString('onclick', $out);
    }

    public function testNeutralizesJavascriptProtocol(): void
    {
        $out = Html::sanitize('<a href="javascript:alert(1)">x</a>');
        $this->assertStringNotContainsString('javascript:', $out);
        $this->assertStringContainsString('<a', $out); // 标签保留,协议被中和
    }

    public function testStripsIframeAndStyle(): void
    {
        $out = Html::sanitize('<iframe src="evil"></iframe><style>body{}</style><b>ok</b>');
        $this->assertStringNotContainsString('<iframe', $out);
        $this->assertStringNotContainsString('<style', $out);
        $this->assertStringContainsString('<b>ok</b>', $out);
    }

    public function testKeepsSafeFormatting(): void
    {
        $html = '<h2>标题</h2><p>段落<strong>粗</strong></p><ul><li>项</li></ul>';
        $this->assertSame($html, Html::sanitize($html));
    }

    public function testEmptyStaysEmpty(): void
    {
        $this->assertSame('', Html::sanitize(''));
        $this->assertSame('', Html::sanitize(null));
    }

    /** H2:此前可绕过的危险协议(无引号 / 实体编码 / vbscript / data)必须全部被中和。 */
    public function testNeutralizesProtocolBypasses(): void
    {
        foreach ([
            '<a href=javascript:alert(document.cookie)>x</a>',     // 无引号
            '<a href="java&#115;cript:alert(1)">x</a>',            // 实体编码
            '<a href="  javascript:alert(1)">x</a>',               // 前导空白
            '<a href="vbscript:msgbox(1)">x</a>',
            '<img src="data:text/html,<b>x</b>">',
        ] as $payload) {
            $out = strtolower(html_entity_decode(Html::sanitize($payload), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $out = (string) preg_replace('/[\x00-\x20]+/', '', $out);
            $this->assertStringNotContainsString('javascript:', $out, "未中和: $payload");
            $this->assertStringNotContainsString('vbscript:', $out, "未中和: $payload");
            $this->assertStringNotContainsString('data:', $out, "未中和: $payload");
        }
    }

    /** 合法协议与相对路径不被误伤。 */
    public function testKeepsSafeLinks(): void
    {
        $this->assertStringContainsString('https://ok.com/p', Html::sanitize('<a href="https://ok.com/p">g</a>'));
        $this->assertStringContainsString('/uploads/a.png', Html::sanitize('<a href="/uploads/a.png">r</a>'));
        $this->assertStringContainsString('#sec', Html::sanitize('<a href="#sec">a</a>'));
        $this->assertStringContainsString('mailto:a@b.com', Html::sanitize('<a href="mailto:a@b.com">m</a>'));
    }
}
