<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use think\file\UploadedFile;

/**
 * 图片上传:校验(类型/大小)+ 存储到 public/uploads/Ym/,返回公开 URL。
 * 仅图片,≤2MB;文件名随机化(防覆盖 + 防路径穿越);扩展名白名单。
 */
class UploadService
{
    private const MAX_BYTES = 2 * 1024 * 1024; // 2MB
    private const EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /** 校验图片大小与扩展名;不合法抛 BizException(纯逻辑,可独立单测) */
    public function validateImage(int $size, string $ext): void
    {
        if ($size <= 0) {
            throw new BizException(Code::PARAM_ERROR, '请选择要上传的图片');
        }
        if ($size > self::MAX_BYTES) {
            throw new BizException(Code::PARAM_ERROR, '图片不能超过 2MB');
        }
        if (!in_array(strtolower($ext), self::EXTS, true)) {
            throw new BizException(Code::PARAM_ERROR, '仅支持 jpg / png / gif / webp 图片');
        }
    }

    /** 存储已上传文件,返回公开访问 URL(如 /uploads/202606/xxxx.png) */
    public function store(UploadedFile $file): string
    {
        if (!$file->isValid()) {
            throw new BizException(Code::PARAM_ERROR, '上传失败,请重试');
        }
        $ext = strtolower($file->getOriginalExtension() ?: $file->extension());
        $this->validateImage((int) $file->getSize(), $ext);

        $sub = date('Ym');
        $dir = public_path() . 'uploads' . DIRECTORY_SEPARATOR . $sub;
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $name = bin2hex(random_bytes(8)) . '.' . $ext;
        $file->move($dir, $name);

        return '/uploads/' . $sub . '/' . $name;
    }
}
