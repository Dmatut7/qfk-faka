<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Card;
use app\model\Product;
use tests\TestCase;

/**
 * 卡密管理 HTTP 端点 (T4.3):导入/列表/统计/作废/删除/归属。
 */
class CardManageTest extends TestCase
{
    private $m;
    private string $token;
    private $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->token = $this->merchantToken((int) $this->m->id);
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '5.00']);
    }

    public function testImportEndpoint(): void
    {
        $r = $this->callJson('POST', '/merchant/cards/import', [
            'product_id' => $this->p->id, 'cards' => "C1\nC2\nC1\n\nC3",
        ], $this->bearer($this->token));

        $this->assertSame(0, $r['code']);
        $this->assertSame(3, $r['data']['imported']);   // C1,C2,C3
        $this->assertSame(1, $r['data']['duplicated']); // 第二个 C1
        $this->assertSame(1, $r['data']['empty']);
        $this->assertSame(3, $r['data']['stock']);
    }

    public function testListWithStatusFilterAndStats(): void
    {
        $this->callJson('POST', '/merchant/cards/import', ['product_id' => $this->p->id, 'cards' => "A\nB\nC"], $this->bearer($this->token));

        $list = $this->callJson('GET', '/merchant/products/' . $this->p->id . '/cards', ['status' => Card::STATUS_UNSOLD], $this->bearer($this->token));
        $this->assertSame(3, $list['data']['total']);

        $stats = $this->callJson('GET', '/merchant/products/' . $this->p->id . '/cards/stats', [], $this->bearer($this->token));
        $this->assertSame(3, $stats['data']['unsold']);
        $this->assertSame(0, $stats['data']['sold']);
        $this->assertSame(3, $stats['data']['stock']);
    }

    public function testDisableUnsoldCardDecrementsStock(): void
    {
        $this->callJson('POST', '/merchant/cards/import', ['product_id' => $this->p->id, 'cards' => "A\nB"], $this->bearer($this->token));
        $card = Card::where('product_id', $this->p->id)->find();

        $r = $this->callJson('POST', '/merchant/cards/' . $card->id . '/disable', [], $this->bearer($this->token));
        $this->assertSame(0, $r['code']);
        $this->assertSame(Card::STATUS_DISABLED, Card::find($card->id)->status);
        $this->assertSame(1, Product::find($this->p->id)->stock);
    }

    public function testDeleteUnsoldCardDecrementsStock(): void
    {
        $this->callJson('POST', '/merchant/cards/import', ['product_id' => $this->p->id, 'cards' => "A\nB"], $this->bearer($this->token));
        $card = Card::where('product_id', $this->p->id)->find();

        $this->callJson('POST', '/merchant/cards/' . $card->id . '/delete', [], $this->bearer($this->token));
        $this->assertNull(Card::find($card->id));
        $this->assertSame(1, Product::find($this->p->id)->stock);
    }

    public function testCannotDisableSoldCard(): void
    {
        $card = Card::create(['merchant_id' => $this->m->id, 'product_id' => $this->p->id, 'secret' => 'S', 'secret_hash' => Card::hashSecret('S'), 'status' => Card::STATUS_SOLD]);
        $r = $this->callJson('POST', '/merchant/cards/' . $card->id . '/disable', [], $this->bearer($this->token));
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testCannotImportToOthersProduct(): void
    {
        $other = $this->makeMerchant();
        $resp = $this->call('POST', '/merchant/cards/import', ['product_id' => $this->p->id, 'cards' => 'X'], $this->bearer($this->merchantToken((int) $other->id)));
        $this->assertSame(403, $resp->getCode());
    }

    public function testImportRequiresCards(): void
    {
        $resp = $this->call('POST', '/merchant/cards/import', ['product_id' => $this->p->id], $this->bearer($this->token));
        $this->assertSame(422, $resp->getCode());
    }
}
