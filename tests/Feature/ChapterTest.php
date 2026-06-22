<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Order;
use app\model\Product;
use app\model\ProductChapter;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 知识类章节:商户 CRUD + 购前目录(仅标题)+ 购后阅读(验证归属/已发货/知识类)。
 */
class ChapterTest extends TestCase
{
    private $m;
    private $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => '课程', 'price' => '9.90', 'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE]);
    }

    private function mtok(): array
    {
        return $this->bearer($this->merchantToken((int) $this->m->id));
    }

    private function knowledgeOrder(int $status, string $email = 'b@x.com'): Order
    {
        return Order::create([
            'order_no' => OrderNo::generate(), 'merchant_id' => $this->m->id, 'product_id' => $this->p->id,
            'goods_type' => Product::GOODS_TYPE_KNOWLEDGE, 'buyer_email' => $email, 'quantity' => 1,
            'unit_price' => '9.90', 'total_amount' => '9.90', 'status' => $status,
            'expire_at' => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    public function testMerchantChapterCrud(): void
    {
        $r = $this->callJson('POST', '/merchant/products/' . $this->p->id . '/chapters', ['title' => '第一章', 'content' => '<p>正文</p>', 'sort' => 1], $this->mtok());
        $this->assertSame(0, $r['code']);
        $cid = $r['data']['id'];

        $list = $this->callJson('GET', '/merchant/products/' . $this->p->id . '/chapters', [], $this->mtok());
        $this->assertCount(1, $list['data']['items']);

        $this->callJson('POST', '/merchant/chapters/' . $cid, ['title' => '第一章(改)'], $this->mtok());
        $this->assertSame('第一章(改)', ProductChapter::find($cid)->title);

        $this->callJson('POST', '/merchant/chapters/' . $cid . '/delete', [], $this->mtok());
        $this->assertNull(ProductChapter::find($cid));
    }

    public function testCannotManageOthersChapters(): void
    {
        $other = $this->makeMerchant();
        $r = $this->callJson('POST', '/merchant/products/' . $this->p->id . '/chapters', ['title' => 'x'], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(Code::FORBIDDEN, $r['code']); // 非本人商品
    }

    public function testPublicTocReturnsTitlesOnly(): void
    {
        ProductChapter::create(['product_id' => $this->p->id, 'merchant_id' => $this->m->id, 'title' => '上架章', 'content' => '秘密', 'sort' => 1, 'status' => 1]);
        ProductChapter::create(['product_id' => $this->p->id, 'merchant_id' => $this->m->id, 'title' => '下架章', 'content' => 'x', 'sort' => 2, 'status' => 0]);

        $r = $this->callJson('GET', '/buyer/product/' . $this->p->id . '/chapters');
        $this->assertSame(0, $r['code']);
        $titles = array_column($r['data']['items'], 'title');
        $this->assertContains('上架章', $titles);
        $this->assertNotContains('下架章', $titles); // 下架不出现
        $this->assertArrayNotHasKey('content', $r['data']['items'][0]); // 购前不含正文
    }

    public function testBuyerReadsChaptersAfterDelivery(): void
    {
        ProductChapter::create(['product_id' => $this->p->id, 'merchant_id' => $this->m->id, 'title' => '第一章', 'content' => '<p>全文</p>', 'sort' => 1, 'status' => 1]);
        $order = $this->knowledgeOrder(Order::STATUS_DELIVERED);

        $r = $this->callJson('POST', '/buyer/order/chapters', ['order_no' => $order->order_no, 'email' => 'b@x.com']);
        $this->assertSame(0, $r['code']);
        $this->assertSame('第一章', $r['data']['chapters'][0]['title']);
        $this->assertSame('<p>全文</p>', $r['data']['chapters'][0]['content']); // 购后含正文
    }

    public function testCannotReadBeforeDelivery(): void
    {
        ProductChapter::create(['product_id' => $this->p->id, 'merchant_id' => $this->m->id, 'title' => 'c', 'content' => 'x', 'status' => 1]);
        $order = $this->knowledgeOrder(Order::STATUS_PENDING);
        $r = $this->callJson('POST', '/buyer/order/chapters', ['order_no' => $order->order_no, 'email' => 'b@x.com']);
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testReadRejectsWrongEmail(): void
    {
        $order = $this->knowledgeOrder(Order::STATUS_DELIVERED);
        $r = $this->callJson('POST', '/buyer/order/chapters', ['order_no' => $order->order_no, 'email' => 'attacker@x.com']);
        $this->assertSame(Code::FORBIDDEN, $r['code']);
    }
}
