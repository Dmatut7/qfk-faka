<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Category;
use app\model\Product;
use tests\TestCase;

/**
 * 商户商品 CRUD + 上下架 + 限购 + 归属 (T4.2)。
 */
class ProductCrudTest extends TestCase
{
    public function testCreateAndList(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $cat = Category::create(['merchant_id' => $m->id, 'name' => '点卡']);

        $r = $this->callJson('POST', '/merchant/products', [
            'title' => 'Steam卡', 'price' => '49.90', 'category_id' => $cat->id,
            'min_buy' => 1, 'max_buy' => 5,
        ], $this->bearer($token));

        $this->assertSame(0, $r['code']);
        $this->assertSame('49.90', $r['data']['price']);
        $this->assertSame(Product::STATUS_ON, $r['data']['status']);
        $this->assertSame($cat->id, $r['data']['category_id']);

        $list = $this->callJson('GET', '/merchant/products', [], $this->bearer($token));
        $this->assertCount(1, $list['data']);
    }

    public function testGoodsTypeDefaultsToCard(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/merchant/products', [
            'title' => '默认卡密', 'price' => '1.00',
        ], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(0, $r['code']);
        $this->assertSame(Product::GOODS_TYPE_CARD, (int) Product::find($r['data']['id'])->goods_type);
    }

    public function testCreateWithGoodsTypeAndInvalidFallback(): void
    {
        $m = $this->makeMerchant();
        $token = $this->bearer($this->merchantToken((int) $m->id));

        // 知识类
        $r = $this->callJson('POST', '/merchant/products', [
            'title' => '课程', 'price' => '9.90', 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE,
        ], $token);
        $this->assertSame(Product::GOODS_TYPE_KNOWLEDGE, (int) Product::find($r['data']['id'])->goods_type);

        // 非法值回退卡密
        $r2 = $this->callJson('POST', '/merchant/products', [
            'title' => '乱填', 'price' => '9.90', 'goods_type' => 99,
        ], $token);
        $this->assertSame(Product::GOODS_TYPE_CARD, (int) Product::find($r2['data']['id'])->goods_type);
    }

    public function testUpdateGoodsType(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'p', 'price' => '5.00', 'goods_type' => Product::GOODS_TYPE_CARD]);
        $this->callJson('POST', '/merchant/products/' . $p->id, [
            'goods_type' => Product::GOODS_TYPE_RESOURCE,
        ], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(Product::GOODS_TYPE_RESOURCE, (int) Product::find($p->id)->goods_type);
    }

    public function testPriceMustBePositive(): void
    {
        $m = $this->makeMerchant();
        $resp = $this->call('POST', '/merchant/products', ['title' => 'x', 'price' => '0'], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(422, $resp->getCode());
    }

    public function testCannotUseOthersCategory(): void
    {
        $m = $this->makeMerchant();
        $other = $this->makeMerchant();
        $cat = Category::create(['merchant_id' => $other->id, 'name' => '别人分类']);

        $r = $this->callJson('POST', '/merchant/products', ['title' => 'x', 'price' => '1.00', 'category_id' => $cat->id], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(Code::PARAM_ERROR, $r['code']);
    }

    public function testUpdateAndToggleStatus(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '旧', 'price' => '10.00']);

        $this->callJson('POST', '/merchant/products/' . $p->id, ['title' => '新标题', 'price' => '12.50'], $this->bearer($token));
        $reload = Product::find($p->id);
        $this->assertSame('新标题', $reload->title);
        $this->assertSame('12.50', $reload->price);

        // 下架
        $this->callJson('POST', '/merchant/products/' . $p->id . '/status', ['status' => 0], $this->bearer($token));
        $this->assertSame(Product::STATUS_OFF, Product::find($p->id)->status);
        // 上架
        $this->callJson('POST', '/merchant/products/' . $p->id . '/status', ['status' => 1], $this->bearer($token));
        $this->assertSame(Product::STATUS_ON, Product::find($p->id)->status);
    }

    public function testDeleteEmptyProduct(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'tmp', 'price' => '1.00']);

        $r = $this->callJson('POST', '/merchant/products/' . $p->id . '/delete', [], $this->bearer($token));
        $this->assertSame(0, $r['code']);
        $this->assertNull(Product::find($p->id));
    }

    public function testCannotDeleteProductWithCards(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '有卡', 'price' => '1.00']);
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => 'S1', 'secret_hash' => Card::hashSecret('S1')]);

        $r = $this->callJson('POST', '/merchant/products/' . $p->id . '/delete', [], $this->bearer($token));
        $this->assertSame(Code::STATE_INVALID, $r['code']);
        $this->assertNotNull(Product::find($p->id), '有卡密的商品不应被删除');
    }

    public function testCannotEditOthersProduct(): void
    {
        $owner = $this->makeMerchant();
        $other = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $owner->id, 'title' => '别人的', 'price' => '1.00']);

        $resp = $this->call('POST', '/merchant/products/' . $p->id, ['title' => 'hack'], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $resp->getCode());
    }

    /**
     * 创建时 max_buy>0 且 max_buy<min_buy → 该商品任何数量都买不了(不可买漏洞),
     * 落库前必须拒绝并返回参数错误,且不创建商品。
     */
    public function testCreateRejectsMaxBuyLessThanMinBuy(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);

        $r = $this->callJson('POST', '/merchant/products', [
            'title' => '坏限购', 'price' => '9.90', 'min_buy' => 5, 'max_buy' => 2,
        ], $this->bearer($token));

        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        $this->assertSame(0, Product::where('merchant_id', $m->id)->count(), '不合法的限购区间不应落库');
    }

    /** max_buy=0(不限购)合法,即便 min_buy 较大也应创建成功。 */
    public function testCreateAllowsUnlimitedMaxBuy(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);

        $r = $this->callJson('POST', '/merchant/products', [
            'title' => '不限购', 'price' => '9.90', 'min_buy' => 5, 'max_buy' => 0,
        ], $this->bearer($token));

        $this->assertSame(0, $r['code']);
        $this->assertSame(5, (int) $r['data']['min_buy']);
        $this->assertSame(0, (int) $r['data']['max_buy']);
    }

    /**
     * 更新时仅改 min_buy,使其超过现有 max_buy → 用合并后有效值校验,应被拒;
     * 现值保持不变。
     */
    public function testUpdateRejectsMinBuyExceedingExistingMaxBuy(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '限购品', 'price' => '9.90', 'min_buy' => 1, 'max_buy' => 3]);

        $r = $this->callJson('POST', '/merchant/products/' . $p->id, [
            'min_buy' => 10,
        ], $this->bearer($token));

        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        $reload = Product::find($p->id);
        $this->assertSame(1, (int) $reload->min_buy, '非法更新不应改动 min_buy');
        $this->assertSame(3, (int) $reload->max_buy);
    }

    /**
     * 更新时仅改 max_buy,使其低于现有 min_buy → 应被拒,现值不变。
     */
    public function testUpdateRejectsMaxBuyBelowExistingMinBuy(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '限购品', 'price' => '9.90', 'min_buy' => 4, 'max_buy' => 0]);

        $r = $this->callJson('POST', '/merchant/products/' . $p->id, [
            'max_buy' => 2,
        ], $this->bearer($token));

        $this->assertSame(Code::PARAM_ERROR, $r['code']);
        $reload = Product::find($p->id);
        $this->assertSame(0, (int) $reload->max_buy, '非法更新不应改动 max_buy');
    }
}
