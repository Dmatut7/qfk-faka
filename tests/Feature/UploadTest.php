<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\service\UploadService;
use tests\TestCase;

/**
 * 图片上传校验(类型/大小白名单)。纯逻辑单测,不落盘。
 */
class UploadTest extends TestCase
{
    public function testRejectsOversizedImage(): void
    {
        $this->expectException(BizException::class);
        (new UploadService())->validateImage(3 * 1024 * 1024, 'png'); // 3MB > 2MB
    }

    public function testRejectsNonImageExtension(): void
    {
        $this->expectException(BizException::class);
        (new UploadService())->validateImage(1024, 'php'); // 危险扩展名
    }

    public function testRejectsEmpty(): void
    {
        $this->expectException(BizException::class);
        (new UploadService())->validateImage(0, 'png');
    }

    public function testAcceptsValidImageCaseInsensitive(): void
    {
        (new UploadService())->validateImage(500 * 1024, 'PNG'); // 大小写不敏感,不抛即通过
        $this->assertTrue(true);
    }
}
