<?php
declare(strict_types=1);

namespace app\controller\merchant;

use app\controller\BaseApiController;
use app\service\ProductService;

/**
 * 商户后台:商品管理(受 MerchantAuth 保护)。
 */
class Product extends BaseApiController
{
    public function index(ProductService $svc)
    {
        $filter = $this->params(['category_id', 'status']);
        return $this->success($svc->list($this->authId(), $filter));
    }

    public function create(ProductService $svc)
    {
        $d = $this->params(['category_id', 'title', 'sku', 'description', 'image', 'price', 'market_price', 'type', 'min_buy', 'max_buy', 'delivery_message', 'purchase_notice', 'show_stock_type', 'status', 'sort']);
        $this->validate($d, [
            'title'        => 'require|max:128',
            'image'        => 'max:500',
            'price'        => 'require|float|gt:0',
            'market_price' => 'float|egt:0',
            'min_buy'      => 'integer|egt:1',
            'max_buy'      => 'integer|egt:0',
            'show_stock_type' => 'in:0,1',
        ], [
            'price.gt' => '价格必须大于 0',
        ]);
        return $this->success($svc->create($this->authId(), $d)->toArray());
    }

    public function update(ProductService $svc, $id)
    {
        $d = $this->params(['category_id', 'title', 'sku', 'description', 'image', 'price', 'market_price', 'type', 'min_buy', 'max_buy', 'delivery_message', 'purchase_notice', 'show_stock_type', 'sort']);
        if (isset($d['show_stock_type']) && $d['show_stock_type'] !== '') {
            $this->validate($d, ['show_stock_type' => 'in:0,1']);
        }
        if (isset($d['price'])) {
            $this->validate($d, ['price' => 'float|gt:0'], ['price.gt' => '价格必须大于 0']);
        }
        if (isset($d['market_price']) && $d['market_price'] !== '') {
            $this->validate($d, ['market_price' => 'float|egt:0']);
        }
        return $this->success($svc->update($this->authId(), (int) $id, $d)->toArray());
    }

    public function setStatus(ProductService $svc, $id)
    {
        $status = (int) $this->input('status', 1);
        return $this->success($svc->setStatus($this->authId(), (int) $id, $status)->toArray());
    }

    public function delete(ProductService $svc, $id)
    {
        $svc->delete($this->authId(), (int) $id);
        return $this->success();
    }
}
