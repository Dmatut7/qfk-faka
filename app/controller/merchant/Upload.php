<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\common\BizException;
use app\common\Code;
use app\controller\BaseApiController;
use app\service\UploadService;

/**
 * 商户后台:图片上传(商品主图 / 店铺 logo·封面)。受 MerchantAuth 保护。
 * 前端以 multipart/form-data 提交字段 file;返回 { url }。
 */
class Upload extends BaseApiController
{
    public function image(UploadService $svc)
    {
        $file = $this->request->file('file');
        if (!$file) {
            throw new BizException(Code::PARAM_ERROR, '请选择要上传的图片');
        }
        return $this->success(['url' => $svc->store($file)]);
    }
}
