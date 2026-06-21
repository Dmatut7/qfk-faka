<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\MerchantStatsService;

/**
 * 商户后台:销售统计(受 MerchantAuth 保护)。
 */
class Stats extends BaseApiController
{
    public function summary(MerchantStatsService $svc)
    {
        return $this->success($svc->summary(
            $this->authId(),
            (string) $this->input('start', ''),
            (string) $this->input('end', '')
        ));
    }

    public function topProducts(MerchantStatsService $svc)
    {
        return $this->success($svc->topProducts(
            $this->authId(),
            (string) $this->input('start', ''),
            (string) $this->input('end', ''),
            (int) $this->input('limit', 10)
        ));
    }
}
