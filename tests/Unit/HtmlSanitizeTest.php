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
}
