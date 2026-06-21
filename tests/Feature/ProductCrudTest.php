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
}
