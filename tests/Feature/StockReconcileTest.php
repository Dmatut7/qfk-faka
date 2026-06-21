<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Product;
use tests\TestCase;
use think\facade\Console;
use think\facade\Db;

/**
 * 库存/资金对账命令 stock:reconcile (T9.2):
 * - products.stock 重算为真实未售卡数,修正漂移;不动 cards 状态。
 * - 资金自检仅报告 SUM(fund_log.amount) 与 balance 的差异,不改余额。
 * - 幂等:重复执行无副作用。
 */
class StockReconcileTest extends TestCase
{
    private function makeProduct(int $merchantId, int $stock): Product
    {
        $u = uniqid();
        return Product::create([
            'merchant_id' => $merchantId,
            'title'       => '商品_' . $u,
            'sku'         => 'sku_' . $u,
            'price'       => '9.90',
            'type'        => Product::TYPE_AUTO,
            'stock'       => $stock,
            'status'      => Product::STATUS_ON,
        ]);
    }

    private function makeCard(int $merchantId, int $productId, int $status): Card
    {
        $secret = 'card_' . uniqid();
        return Card::create([
            'merchant_id' => $merchantId,
            'product_id'  => $productId,
            'secret'      => $secret,
            'secret_hash' => Card::hashSecret($secret),
            'status'      => $status,
        ]);
    }

    public function testStockRecalculatedToRealUnsoldCount(): void
    {
        $m = $this->makeMerchant();
        // 真实未售应为 2,但缓存里写成漂移值 99
        $p = $this->makeProduct((int) $m->id, 99);

        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_UNSOLD);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_UNSOLD);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_LOCKED);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_SOLD);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_DISABLED);

        Console::call('stock:reconcile');

        $reload = Product::find($p->id);
        $this->assertSame(2, (int) $reload->stock, 'stock 应被修正为真实未售卡数');

        // 不动 cards 状态:未售卡仍为 2,锁定/已售/作废各 1
        $this->assertSame(2, Card::where('product_id', $p->id)->where('status', Card::STATUS_UNSOLD)->count());
        $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_LOCKED)->count());
        $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_SOLD)->count());
        $this->assertSame(1, Card::where('product_id', $p->id)->where('status', Card::STATUS_DISABLED)->count());
    }

    public function testCorrectStockLeftUnchangedAndIdempotent(): void
    {
        $m = $this->makeMerchant();
        $p = $this->makeProduct((int) $m->id, 0);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_UNSOLD);

        Console::call('stock:reconcile');
        $this->assertSame(1, (int) Product::find($p->id)->stock);

        // 再次执行:幂等,结果不变
        Console::call('stock:reconcile');
        $this->assertSame(1, (int) Product::find($p->id)->stock);
    }

    public function testProductWithNoUnsoldCardsBecomesZero(): void
    {
        $m = $this->makeMerchant();
        $p = $this->makeProduct((int) $m->id, 5);
        $this->makeCard((int) $m->id, (int) $p->id, Card::STATUS_SOLD);

        Console::call('stock:reconcile');

        $this->assertSame(0, (int) Product::find($p->id)->stock);
    }

    public function testFundCheckDoesNotMutateBalance(): void
    {
        // 故意制造不一致:余额 100,但只有一条 +30 流水(SUM=30 != 100)
        $m = $this->makeMerchant(['balance' => '100.00']);
        MerchantFundLog::create([
            'merchant_id'   => (int) $m->id,
            'type'          => MerchantFundLog::TYPE_INCOME,
            'amount'        => '30.00',
            'balance_after' => '30.00',
        ]);

        Console::call('stock:reconcile');

        // 余额是权威,不被对账命令修改
        $this->assertSame('100.00', Merchant::find($m->id)->balance);
    }
}
