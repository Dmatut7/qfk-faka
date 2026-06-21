<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Announcement;
use app\model\Merchant;
use tests\TestCase;

/**
 * 平台公告管理:后台 CRUD + 店铺前台 notices(status 过滤 / 排序)。
 */
class AnnouncementTest extends TestCase
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

    public function testCreateAnnouncement(): void
    {
        $r = $this->callJson('POST', '/admin/announcements', [
            'title'   => '系统维护通知',
            'content' => '今晚 0 点维护',
            'status'  => 1,
            'sort'    => 5,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $this->assertSame('系统维护通知', $r['data']['title']);
        $this->assertSame(1, $r['data']['status']);
        $this->assertSame(5, $r['data']['sort']);

        $a = Announcement::find($r['data']['id']);
        $this->assertNotNull($a);
        $this->assertSame('今晚 0 点维护', $a->content);
        $this->assertSame(Announcement::STATUS_SHOWN, (int) $a->status);
    }

    public function testCreateRequiresTitleAndContent(): void
    {
        $r1 = $this->callJson('POST', '/admin/announcements', [
            'title'   => '',
            'content' => '正文',
        ], $this->hdr());
        $this->assertSame(1001, $r1['code']);

        $r2 = $this->callJson('POST', '/admin/announcements', [
            'title'   => '标题',
            'content' => '',
        ], $this->hdr());
        $this->assertSame(1001, $r2['code']);
    }

    public function testListReturnsAllStatusesSortedDesc(): void
    {
        Announcement::create(['title' => 'A', 'content' => 'a', 'status' => 1, 'sort' => 1]);
        Announcement::create(['title' => 'B', 'content' => 'b', 'status' => 0, 'sort' => 9]);

        $r = $this->callJson('GET', '/admin/announcements', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $items = $r['data']['items'];
        $this->assertGreaterThanOrEqual(2, count($items));
        // 按 sort 倒序:sort=9 的 B 在 sort=1 的 A 之前
        $titles = array_column($items, 'title');
        $posB   = array_search('B', $titles, true);
        $posA   = array_search('A', $titles, true);
        $this->assertNotFalse($posA);
        $this->assertNotFalse($posB);
        $this->assertLessThan($posA, $posB);
        // 后台列表含隐藏公告
        $statuses = array_column($items, 'status');
        $this->assertContains(0, $statuses);
    }

    public function testUpdateAnnouncement(): void
    {
        $a = Announcement::create(['title' => '旧', 'content' => '旧内容', 'status' => 1, 'sort' => 0]);

        $r = $this->callJson('POST', '/admin/announcements/' . $a->id, [
            'title'   => '新标题',
            'content' => '新内容',
            'status'  => 0,
            'sort'    => 8,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $fresh = Announcement::find($a->id);
        $this->assertSame('新标题', $fresh->title);
        $this->assertSame('新内容', $fresh->content);
        $this->assertSame(Announcement::STATUS_HIDDEN, (int) $fresh->status);
        $this->assertSame(8, (int) $fresh->sort);
    }

    public function testDeleteAnnouncement(): void
    {
        $a = Announcement::create(['title' => '待删', 'content' => 'x', 'status' => 1, 'sort' => 0]);

        $r = $this->callJson('POST', '/admin/announcements/' . $a->id . '/delete', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertNull(Announcement::find($a->id));
    }

    public function testRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/announcements')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/announcements', [
            'title' => 't', 'content' => 'c',
        ])->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/announcements/1')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/announcements/1/delete')->getCode());
    }

    public function testShownAnnouncementAppearsInStoreNotices(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'shop_' . uniqid()]);
        Announcement::create(['title' => '可见公告', 'content' => '内容', 'status' => 1, 'sort' => 3]);

        $body = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame(0, $body['code']);
        $this->assertArrayHasKey('notices', $body['data']);
        $titles = array_column($body['data']['notices'], 'title');
        $this->assertContains('可见公告', $titles);
        // notices 仅含精简字段
        $first = $body['data']['notices'][0];
        $this->assertSame(['id', 'title', 'content', 'create_time'], array_keys($first));
    }

    public function testHiddenAnnouncementAbsentFromStoreNotices(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'shop_' . uniqid()]);
        Announcement::create(['title' => '隐藏公告', 'content' => '内容', 'status' => 0, 'sort' => 9]);

        $body = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame(0, $body['code']);
        $titles = array_column($body['data']['notices'], 'title');
        $this->assertNotContains('隐藏公告', $titles);
    }

    public function testStoreNoticesSortedDescAndLimited(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'shop_' . uniqid()]);
        // 创建 6 条显示公告,sort 0..5;前台最多 5 条且按 sort 倒序
        for ($i = 0; $i <= 5; $i++) {
            Announcement::create(['title' => 'N' . $i, 'content' => 'c', 'status' => 1, 'sort' => $i]);
        }

        $body   = $this->callJson('GET', '/s/' . $m->store_slug);
        $notices = $body['data']['notices'];
        $this->assertLessThanOrEqual(Announcement::STORE_LIMIT, count($notices));
        // 最大 sort=5 的 N5 应排第一
        $this->assertSame('N5', $notices[0]['title']);
        // sort=0 的 N0 被截断(超出前 5 条)
        $titles = array_column($notices, 'title');
        $this->assertNotContains('N0', $titles);
    }
}
