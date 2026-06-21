<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\Product;
use tests\TestCase;

/**
 * 卡密表/模型 (T2.4)。
 */
class CardModelTest extends TestCase
{
    private array $ctx;

    protected function setUp(): void
    {
        parent::setUp();
        $u = uniqid();
        $m = Merchant::create(['username' => 'm_' . $u, 'password' => 'x', 'store_name' => 's', 'store_slug' => 'sl_' . $u]);
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'card', 'price' => '5.00']);
        $this->ctx = ['m' => $m, 'p' => $p];
    }

    private function card(string $secret, array $override = []): Card
    {
        return Card::create(array_merge([
            'merchant_id' => $this->ctx['m']->id,
            'product_id'  => $this->ctx['p']->id,
            'secret'      => $secret,
            'secret_hash' => Card::hashSecret($secret),
        ], $override));
    }

    public function testCreateDefaultsUnsold(): void
    {
        $c = $this->card('AAAA-BBBB-CCCC');
        $found = Card::find($c->id);
        $this->assertSame(Card::STATUS_UNSOLD, $found->status);
        $this->assertNull($found->order_id);
        $this->assertSame('AAAA-BBBB-CCCC', $found->secret);
        $this->assertSame(hash('sha256', 'AAAA-BBBB-CCCC'), $found->secret_hash);
    }

    public function testUniqueSecretPerProduct(): void
    {
        $this->card('DUP-CARD');
        $this->expectException(\Exception::class);
        $this->card('DUP-CARD'); // 同商品同卡密 → uniq_secret 冲突
    }

    public function testSameSecretDifferentProductAllowed(): void
    {
        $this->card('SHARED');
        $p2 = Product::create(['merchant_id' => $this->ctx['m']->id, 'title' => 'p2', 'price' => '1.00']);
        $c = Card::create([
            'merchant_id' => $this->ctx['m']->id, 'product_id' => $p2->id,
            'secret' => 'SHARED', 'secret_hash' => Card::hashSecret('SHARED'),
        ]);
        $this->assertGreaterThan(0, $c->id);
    }

    public function testForeignKeyRejectsBadProduct(): void
    {
        $this->expectException(\Exception::class);
        Card::create([
            'merchant_id' => $this->ctx['m']->id, 'product_id' => 99999999,
            'secret' => 'X', 'secret_hash' => Card::hashSecret('X'),
        ]);
    }

    public function testProductWithCardCannotBeHardDeleted(): void
    {
        $this->card('LOCKED-PRODUCT');
        $this->expectException(\Exception::class);
        Product::destroy($this->ctx['p']->id); // cards→products RESTRICT
    }
}
