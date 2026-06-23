<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\model\Card;
use app\model\Product;
use app\service\CardService;
use tests\TestCase;

/**
 * 卡密批量导入:去重与计数 (T4.3, TDD)。
 */
class CardImportTest extends TestCase
{
    private CardService $svc;
    private $m;
    private $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new CardService();
        $this->m = $this->makeMerchant();
        $this->p = Product::create(['merchant_id' => $this->m->id, 'title' => 'card', 'price' => '5.00']);
    }

    public function testImportNLinesGivesNCards(): void
    {
        $r = $this->svc->import((int) $this->m->id, (int) $this->p->id, "AAA\nBBB\nCCC");
        $this->assertSame(3, $r['imported']);
        $this->assertSame(0, $r['duplicated']);
        $this->assertSame(3, Card::where('product_id', $this->p->id)->where('status', Card::STATUS_UNSOLD)->count());
        // stock 同步
        $this->assertSame(3, Product::find($this->p->id)->stock);
    }

    /** H4:单次导入超过行数硬上限(10000)被拒,防无界导入撑爆内存/INSERT。 */
    public function testImportRowLimitEnforced(): void
    {
        $raw = implode("\n", array_map(static fn ($i) => 'K' . $i, range(1, 10001)));
        try {
            $this->svc->import((int) $this->m->id, (int) $this->p->id, $raw);
            $this->fail('超过导入上限应被拒');
        } catch (\app\common\BizException $e) {
            $this->assertSame(\app\common\Code::PARAM_ERROR, $e->getBizCode());
        }
        // 拒绝时不应写入任何卡
        $this->assertSame(0, Card::where('product_id', $this->p->id)->count());
    }

    public function testInternalDuplicatesSkipped(): void
    {
        $r = $this->svc->import((int) $this->m->id, (int) $this->p->id, "AAA\nAAA\nBBB");
        $this->assertSame(2, $r['imported']);
        $this->assertSame(1, $r['duplicated']);
        $this->assertSame(2, Product::find($this->p->id)->stock);
    }

    public function testExistingDuplicatesSkippedOnReimport(): void
    {
        $this->svc->import((int) $this->m->id, (int) $this->p->id, "AAA\nBBB");
        // 再导入 A,B(已存在)+ D(新)
        $r = $this->svc->import((int) $this->m->id, (int) $this->p->id, "AAA\nBBB\nDDD");
        $this->assertSame(1, $r['imported']);   // 仅 D
        $this->assertSame(2, $r['duplicated']); // A,B 已存在
        $this->assertSame(3, Product::find($this->p->id)->stock);
    }

    public function testEmptyLinesAndTrim(): void
    {
        $r = $this->svc->import((int) $this->m->id, (int) $this->p->id, "  AAA  \n\n   \nBBB");
        $this->assertSame(2, $r['imported']);
        $this->assertSame(2, $r['empty']);
        // 去除首尾空格后存储
        $this->assertNotNull(Card::where('product_id', $this->p->id)->where('secret', 'AAA')->find());
    }

    public function testImportToOthersProductRejected(): void
    {
        $other = $this->makeMerchant();
        $this->expectException(BizException::class);
        $this->svc->import((int) $other->id, (int) $this->p->id, "XXX");
    }

    public function testSameSecretDifferentProductIsAllowed(): void
    {
        $p2 = Product::create(['merchant_id' => $this->m->id, 'title' => 'p2', 'price' => '1.00']);
        $this->svc->import((int) $this->m->id, (int) $this->p->id, "SHARED");
        $r = $this->svc->import((int) $this->m->id, (int) $p2->id, "SHARED");
        $this->assertSame(1, $r['imported'], '不同商品可有相同卡密');
    }
}
