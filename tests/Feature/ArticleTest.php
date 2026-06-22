<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Article;
use app\service\ArticleService;
use tests\TestCase;

/**
 * 门户内容(资讯/FAQ/单页):后台 CRUD + 门户公开查询(published 列表 / detail 浏览量)。
 */
class ArticleTest extends TestCase
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

    public function testCreateArticle(): void
    {
        $r = $this->callJson('POST', '/admin/articles', [
            'type'     => Article::TYPE_NEWS,
            'title'    => '平台上新公告',
            'summary'  => '新增三种商品类型',
            'category' => '平台动态',
            'content'  => '<p>正文 HTML</p>',
            'status'   => 1,
            'sort'     => 5,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $this->assertSame('平台上新公告', $r['data']['title']);
        $this->assertSame(Article::TYPE_NEWS, $r['data']['type']);
        $this->assertSame('平台动态', $r['data']['category']);
        $this->assertSame(1, $r['data']['status']);
        $this->assertSame(5, $r['data']['sort']);

        $a = Article::find($r['data']['id']);
        $this->assertNotNull($a);
        $this->assertSame('<p>正文 HTML</p>', $a->content);
        $this->assertSame('新增三种商品类型', $a->summary);
    }

    public function testCreateRequiresTitleAndContent(): void
    {
        $r1 = $this->callJson('POST', '/admin/articles', ['title' => '', 'content' => 'x'], $this->hdr());
        $this->assertSame(1001, $r1['code']);

        $r2 = $this->callJson('POST', '/admin/articles', ['title' => 't', 'content' => ''], $this->hdr());
        $this->assertSame(1001, $r2['code']);
    }

    public function testCreateInvalidTypeFallsBackToNews(): void
    {
        $r = $this->callJson('POST', '/admin/articles', [
            'type' => 99, 'title' => '无效类型', 'content' => 'c',
        ], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame(Article::TYPE_NEWS, $r['data']['type']);
    }

    public function testListFiltersByTypeAndSortsDesc(): void
    {
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '资讯A', 'content' => 'a', 'status' => 1, 'sort' => 1]);
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '资讯B', 'content' => 'b', 'status' => 0, 'sort' => 9]);
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '问题C', 'content' => 'c', 'status' => 1, 'sort' => 5]);

        $r = $this->callJson('GET', '/admin/articles', ['type' => Article::TYPE_NEWS], $this->hdr());
        $this->assertSame(0, $r['code']);
        $titles = array_column($r['data']['items'], 'title');
        $this->assertContains('资讯A', $titles);
        $this->assertContains('资讯B', $titles);   // 后台含草稿
        $this->assertNotContains('问题C', $titles); // 按 type 过滤
        // 按 sort 倒序:sort=9 的「资讯B」在 sort=1 的「资讯A」之前
        $this->assertLessThan(
            array_search('资讯A', $titles, true),
            array_search('资讯B', $titles, true)
        );
    }

    public function testUpdateArticle(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '旧', 'content' => '旧', 'status' => 1, 'sort' => 0]);

        $r = $this->callJson('POST', '/admin/articles/' . $a->id, [
            'type'    => Article::TYPE_FAQ,
            'title'   => '新标题',
            'content' => '<p>新</p>',
            'status'  => 0,
            'sort'    => 8,
        ], $this->hdr());

        $this->assertSame(0, $r['code']);
        $fresh = Article::find($a->id);
        $this->assertSame('新标题', $fresh->title);
        $this->assertSame(Article::TYPE_FAQ, (int) $fresh->type);
        $this->assertSame(Article::STATUS_DRAFT, (int) $fresh->status);
        $this->assertSame(8, (int) $fresh->sort);
    }

    public function testUpdateEmptyTitleOrContentRejected(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '原', 'content' => '原内容', 'status' => 1, 'sort' => 0]);

        $r1 = $this->callJson('POST', '/admin/articles/' . $a->id, ['title' => ''], $this->hdr());
        $this->assertSame(\app\common\Code::PARAM_ERROR, $r1['code']);

        $r2 = $this->callJson('POST', '/admin/articles/' . $a->id, ['content' => ''], $this->hdr());
        $this->assertSame(\app\common\Code::PARAM_ERROR, $r2['code']);

        // 原数据未被破坏
        $fresh = Article::find($a->id);
        $this->assertSame('原', $fresh->title);
        $this->assertSame('原内容', $fresh->content);
    }

    public function testDeleteArticle(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '待删', 'content' => 'x', 'status' => 1, 'sort' => 0]);
        $r = $this->callJson('POST', '/admin/articles/' . $a->id . '/delete', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertNull(Article::find($a->id));
    }

    public function testRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/articles')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/articles', ['title' => 't', 'content' => 'c'])->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/articles/1')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/articles/1/delete')->getCode());
    }

    // ===== 门户公开查询(Service 直测,/index 路由见 portal-02) =====

    public function testPublishedListReturnsOnlyPublishedOfType(): void
    {
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '已发布资讯', 'content' => 'c', 'status' => 1, 'sort' => 2]);
        Article::create(['type' => Article::TYPE_NEWS, 'title' => '草稿资讯', 'content' => 'c', 'status' => 0, 'sort' => 9]);
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '已发布FAQ', 'content' => 'c', 'status' => 1, 'sort' => 1]);

        $svc  = new ArticleService();
        $list = $svc->published(Article::TYPE_NEWS);
        $titles = array_column($list, 'title');

        $this->assertContains('已发布资讯', $titles);
        $this->assertNotContains('草稿资讯', $titles);   // 草稿不对外
        $this->assertNotContains('已发布FAQ', $titles);  // 类型隔离
        // 列表精简字段不含正文
        $this->assertArrayNotHasKey('content', $list[0]);
    }

    public function testPublishedListFiltersByCategory(): void
    {
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '购买问题', 'content' => 'c', 'category' => '购买', 'status' => 1, 'sort' => 1]);
        Article::create(['type' => Article::TYPE_FAQ, 'title' => '售后问题', 'content' => 'c', 'category' => '售后', 'status' => 1, 'sort' => 1]);

        $svc    = new ArticleService();
        $titles = array_column($svc->published(Article::TYPE_FAQ, '购买'), 'title');
        $this->assertContains('购买问题', $titles);
        $this->assertNotContains('售后问题', $titles);
    }

    public function testDetailReturnsContentAndIncrementsViews(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '详情', 'content' => '<p>全文</p>', 'status' => 1, 'sort' => 0, 'views' => 0]);

        $svc = new ArticleService();
        $d   = $svc->detail((int) $a->id);
        $this->assertSame('<p>全文</p>', $d['content']);
        $this->assertSame(1, $d['views']);
        // 落库浏览量自增
        $this->assertSame(1, (int) Article::find($a->id)->views);
    }

    public function testDetailHiddenForDraft(): void
    {
        $a = Article::create(['type' => Article::TYPE_NEWS, 'title' => '草稿', 'content' => 'c', 'status' => 0, 'sort' => 0]);
        $svc = new ArticleService();
        $this->expectException(\app\common\BizException::class);
        $svc->detail((int) $a->id);
    }
}
