<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\ForbiddenItem;
use tests\TestCase;

/**
 * 禁售目录:后台 CRUD + 门户公开(按类目分组、隐藏项不外露)。
 */
class ForbiddenItemTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->token = $this->makeAdminToken();
    }

    private function hdr(): array
    {
        return $this->bearer($this->token);
    }

    public function testAdminCreateAndList(): void
    {
        $r = $this->callJson('POST', '/admin/forbidden', ['category' => '虚拟货币', 'title' => '比特币等代币', 'description' => '禁止', 'sort' => 5], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame('虚拟货币', ForbiddenItem::find($r['data']['id'])->category);

        $list = $this->callJson('GET', '/admin/forbidden', [], $this->hdr());
        $this->assertGreaterThanOrEqual(1, count($list['data']['items']));
    }

    public function testPublicGroupedHidesDisabled(): void
    {
        ForbiddenItem::create(['category' => '博彩', 'title' => '赌博', 'status' => 1, 'sort' => 1]);
        ForbiddenItem::create(['category' => '博彩', 'title' => '彩票', 'status' => 1, 'sort' => 2]);
        ForbiddenItem::create(['category' => '违法', 'title' => '隐藏项', 'status' => 0, 'sort' => 9]);

        $r = $this->callJson('GET', '/index/forbidden');
        $this->assertSame(0, $r['code']);
        $groups = $r['data']['groups'];
        $cats = array_column($groups, 'category');
        $this->assertContains('博彩', $cats);
        // 隐藏项的类目(违法,仅一条且隐藏)不应出现
        $this->assertNotContains('违法', $cats);
        // 博彩组含 2 项
        $bocai = array_values(array_filter($groups, fn($g) => $g['category'] === '博彩'))[0];
        $this->assertCount(2, $bocai['items']);
    }

    public function testUpdateAndDelete(): void
    {
        $f = ForbiddenItem::create(['category' => 'x', 'title' => '旧', 'status' => 1]);
        $this->callJson('POST', '/admin/forbidden/' . $f->id, ['title' => '新', 'status' => 0], $this->hdr());
        $fresh = ForbiddenItem::find($f->id);
        $this->assertSame('新', $fresh->title);
        $this->assertSame(0, (int) $fresh->status);

        $this->callJson('POST', '/admin/forbidden/' . $f->id . '/delete', [], $this->hdr());
        $this->assertNull(ForbiddenItem::find($f->id));
    }

    public function testEndpointsAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/forbidden')->getCode());
        $this->assertSame(200, $this->call('GET', '/index/forbidden')->getCode()); // 公开
    }
}
