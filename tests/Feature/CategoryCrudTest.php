<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Category;
use tests\TestCase;

/**
 * 商户分类 CRUD + 归属校验 (T4.1)。
 */
class CategoryCrudTest extends TestCase
{
    public function testCreateAndList(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);

        $c = $this->callJson('POST', '/merchant/categories', ['name' => '游戏', 'sort' => 5], $this->bearer($token));
        $this->assertSame(0, $c['code']);
        $this->assertSame('游戏', $c['data']['name']);
        $this->assertSame((int) $m->id, $c['data']['merchant_id']);

        $list = $this->callJson('GET', '/merchant/categories', [], $this->bearer($token));
        $this->assertCount(1, $list['data']);
        $this->assertSame('游戏', $list['data'][0]['name']);
    }

    public function testCreateRequiresName(): void
    {
        $m = $this->makeMerchant();
        $resp = $this->call('POST', '/merchant/categories', ['sort' => 1], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(422, $resp->getCode());
    }

    public function testUpdate(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $cat = Category::create(['merchant_id' => $m->id, 'name' => '旧名']);

        $r = $this->callJson('POST', '/merchant/categories/' . $cat->id, ['name' => '新名', 'status' => 0], $this->bearer($token));
        $this->assertSame(0, $r['code']);
        $this->assertSame('新名', $r['data']['name']);
        $this->assertSame(0, Category::find($cat->id)->status);
    }

    public function testDelete(): void
    {
        $m = $this->makeMerchant();
        $token = $this->merchantToken((int) $m->id);
        $cat = Category::create(['merchant_id' => $m->id, 'name' => 'tmp']);

        $r = $this->callJson('POST', '/merchant/categories/' . $cat->id . '/delete', [], $this->bearer($token));
        $this->assertSame(0, $r['code']);
        $this->assertNull(Category::find($cat->id));
    }

    public function testCannotTouchOthersCategory(): void
    {
        $owner = $this->makeMerchant();
        $other = $this->makeMerchant();
        $cat = Category::create(['merchant_id' => $owner->id, 'name' => '别人的']);

        // other 商户尝试改 owner 的分类 → 403
        $resp = $this->call('POST', '/merchant/categories/' . $cat->id, ['name' => 'hack'], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $resp->getCode());
        $this->assertSame(Code::FORBIDDEN, json_decode($resp->getContent(), true)['code']);

        // 删除同理
        $del = $this->call('POST', '/merchant/categories/' . $cat->id . '/delete', [], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $del->getCode());
    }

    public function testOthersCategoryNotInList(): void
    {
        $a = $this->makeMerchant();
        $b = $this->makeMerchant();
        Category::create(['merchant_id' => $a->id, 'name' => 'A的']);
        Category::create(['merchant_id' => $b->id, 'name' => 'B的']);

        $list = $this->callJson('GET', '/merchant/categories', [], $this->bearer($this->merchantToken((int) $a->id)));
        $this->assertCount(1, $list['data']);
        $this->assertSame('A的', $list['data'][0]['name']);
    }

    public function testRequiresAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/merchant/categories')->getCode());
    }
}
