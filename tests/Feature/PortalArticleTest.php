<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Article;
use tests\TestCase;

/**
 * 门户公开内容 API(/index/articles):列表仅含已发布 + 类型/分类过滤;详情自增浏览量、草稿不可见。
 */
class PortalArticleTest extends TestCase
{
    public function testPublicListReturnsPublishedOnly(): void
    {
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '公开资讯', 'content' => 'c', 'status' => 1, 'sort' => 3]);
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '草稿资讯', 'content' => 'c', 'status' => 0, 'sort' => 9]);
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '常见问题', 'content' => 'c', 'status' => 1, 'sort' => 1]);

        $r = $this->callJson('GET', '/index/articles', ['type' => Article::TYPE_NEWS]);
        $this->assertSame(0, $r['code']);
        $titles = array_column($r['data']['items'], 'title');
        $this->assertContains('公开资讯', $titles);
        $this->assertNotContains('草稿资讯', $titles);  // 草稿不对外
        $this->assertNotContains('常见问题', $titles);  // 类型隔离
        // 列表不含正文
        $this->assertArrayNotHasKey('content', $r['data']['items'][0]);
    }

    public function testPublicListFiltersByCategory(): void
    {
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '购买问题', 'content' => 'c', 'category' => '购买', 'status' => 1]);
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '售后问题', 'content' => 'c', 'category' => '售后', 'status' => 1]);

        $r = $this->callJson('GET', '/index/articles', ['type' => Article::TYPE_FAQ, 'category' => '购买']);
        $titles = array_column($r['data']['items'], 'title');
        $this->assertContains('购买问题', $titles);
        $this->assertNotContains('售后问题', $titles);
    }

    public function testPublicDetailReturnsContentAndIncrementsViews(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '详情', 'content' => '<p>全文</p>', 'status' => 1, 'views' => 0]);

        $r = $this->callJson('GET', '/index/articles/' . $a->id);
        $this->assertSame(0, $r['code']);
        $this->assertSame('<p>全文</p>', $r['data']['content']);
        $this->assertSame(1, $r['data']['views']);
        $this->assertSame(1, (int) Article::find($a->id)->views);
    }

    public function testPublicDetailHiddenForDraft(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '草稿', 'content' => 'c', 'status' => 0]);
        $r = $this->callJson('GET', '/index/articles/' . $a->id);
        $this->assertSame(\app\common\Code::NOT_FOUND, $r['code']);
    }

    public function testPublicEndpointsNeedNoAuth(): void
    {
        // 无鉴权头也应可访问(公开门户)
        $this->assertSame(200, $this->call('GET', '/index/articles')->getCode());
    }
}
