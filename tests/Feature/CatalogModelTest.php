<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Category;
use app\model\Merchant;
use app\model\Product;
use tests\TestCase;

/**
 * 分类 / 商品表与外键 (T2.3)。
 */
class CatalogModelTest extends TestCase
{
    private function merchant(): Merchant
    {
        $u = uniqid();
        return Merchant::create([
            'username' => 'm_' . $u, 'password' => 'x',
            'store_name' => '店', 'store_slug' => 's_' . $u,
            'status' => Merchant::STATUS_ACTIVE,
        ]);
    }

    public function testCategoryAndProductCrud(): void
    {
        $m = $this->merchant();
        $cat = Category::create(['merchant_id' => $m->id, 'name' => '游戏点卡']);
        $p = Product::create([
            'merchant_id' => $m->id, 'category_id' => $cat->id,
            'title' => 'Steam 充值卡', 'price' => '49.90',
        ]);

        $found = Product::find($p->id);
        $this->assertSame('49.90', $found->price);
        $this->assertSame(Product::STATUS_ON, $found->status);
        $this->assertSame(Product::TYPE_AUTO, $found->type);
        $this->assertSame(1, $found->min_buy);
        $this->assertSame(0, $found->stock);
        $this->assertTrue($found->isOnSale());
        $this->assertSame($cat->id, $found->category_id);
    }

    public function testProductWithoutCategoryIsNull(): void
    {
        $m = $this->merchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => '无分类', 'price' => '1.00']);
        $this->assertNull(Product::find($p->id)->category_id);
    }

    public function testCategoryDeleteSetsProductCategoryNull(): void
    {
        $m = $this->merchant();
        $cat = Category::create(['merchant_id' => $m->id, 'name' => '临时']);
        $p = Product::create(['merchant_id' => $m->id, 'category_id' => $cat->id, 'title' => 'x', 'price' => '1.00']);

        Category::destroy($cat->id);

        $this->assertNull(Product::find($p->id)->category_id, '分类删除后商品 category_id 置空(SET NULL)');
    }

    public function testSkuUniquePerMerchant(): void
    {
        $m = $this->merchant();
        Product::create(['merchant_id' => $m->id, 'title' => 'A', 'price' => '1.00', 'sku' => 'SKU1']);

        // 不同商户可用相同 sku
        $m2 = $this->merchant();
        Product::create(['merchant_id' => $m2->id, 'title' => 'B', 'price' => '1.00', 'sku' => 'SKU1']);
        $this->assertTrue(true);

        // 同商户相同 sku 冲突
        $this->expectException(\Exception::class);
        Product::create(['merchant_id' => $m->id, 'title' => 'C', 'price' => '1.00', 'sku' => 'SKU1']);
    }

    public function testForeignKeyRejectsBadMerchant(): void
    {
        $this->expectException(\Exception::class);
        Product::create(['merchant_id' => 99999999, 'title' => 'x', 'price' => '1.00']);
    }

    public function testMerchantWithProductCannotBeHardDeleted(): void
    {
        $m = $this->merchant();
        Product::create(['merchant_id' => $m->id, 'title' => 'x', 'price' => '1.00']);

        // products→merchants RESTRICT
        $this->expectException(\Exception::class);
        Merchant::destroy($m->id);
    }

    public function testMerchantCascadeDeletesCategoryWhenNoProduct(): void
    {
        $m = $this->merchant();
        $cat = Category::create(['merchant_id' => $m->id, 'name' => '仅分类']);

        Merchant::destroy($m->id); // 无商品,RESTRICT 不阻挡;categories CASCADE

        $this->assertNull(Category::find($cat->id), '商户删除级联删除其分类');
    }
}
