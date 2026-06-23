<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Order;
use app\model\Product;
use app\service\CardService;
use app\service\MerchantOrderService;
use app\service\OrderService;
use app\util\CardSecret;
use tests\TestCase;
use think\facade\Db;

/**
 * 卡密落库加密(opt-in:CARD_SECRET_KEY):导入即加密、发货/详情/列表解密为明文、
 * secret_hash 仍为明文哈希(去重不变)、老明文卡向后兼容。
 */
class CardSecretEncryptionTest extends TestCase
{
    protected function setUp(): void
    {
        putenv('CARD_SECRET_KEY=test-card-enc-key-xyz'); // 开启加密
        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        putenv('CARD_SECRET_KEY'); // 复位,绝不泄漏到其它用例
    }

    public function testEncryptDecryptRoundTripAndPlaintextPassthrough(): void
    {
        $enc = CardSecret::encrypt('PLAIN-XYZ');
        $this->assertTrue(CardSecret::isEncrypted($enc), 'encrypt 应产出密文');
        $this->assertNotSame('PLAIN-XYZ', $enc);
        $this->assertSame('PLAIN-XYZ', CardSecret::decrypt($enc), '解密应还原明文');
        // 老明文(无前缀)decrypt 原样返回 —— 向后兼容
        $this->assertSame('legacy-plain', CardSecret::decrypt('legacy-plain'));
    }

    public function testImportEncryptsAtRestDeliversPlaintext(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        (new CardService())->import((int) $m->id, (int) $p->id, "ENC-CARD-1\nENC-CARD-2");
        Product::where('id', $p->id)->update(['stock' => 2]);

        // 落库为密文,但 secret_hash 仍为明文哈希(去重可用)
        $first = Card::where('product_id', $p->id)->order('id', 'asc')->find();
        $this->assertTrue(CardSecret::isEncrypted((string) $first->secret), 'secret 应密文落库');
        $this->assertSame(Card::hashSecret('ENC-CARD-1'), (string) $first->secret_hash);

        // 商户卡列表解密展示明文
        $secrets = array_column((new CardService())->list((int) $m->id, (int) $p->id)['items'], 'secret');
        $this->assertContains('ENC-CARD-1', $secrets);
        $this->assertContains('ENC-CARD-2', $secrets);

        // 下单 → 已支付 → 发货:发货内容快照必须是明文(不含密文前缀)
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 2, 'buyer_email' => 'b@x.com']);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);
        (new OrderService())->deliverManually((int) $order->id);

        $delivered = (string) Order::find($order->id)->delivered_content;
        $this->assertStringContainsString('ENC-CARD-1', $delivered);
        $this->assertStringContainsString('ENC-CARD-2', $delivered);
        $this->assertStringNotContainsString('enc:v1:', $delivered, '发货内容必须明文,绝不含密文');

        // 商户订单详情解密展示
        $detail = (new MerchantOrderService())->detail((int) $m->id, (int) $order->id);
        $this->assertContains('ENC-CARD-1', $detail['cards']);
    }

    public function testLegacyPlaintextCardStillDeliversWhenKeyEnabled(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '10.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        // 直接插入**明文**老卡(模拟启用加密前已存在的库存)
        $plain = 'LEGACY-PLAIN-1';
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $plain, 'secret_hash' => Card::hashSecret($plain)]);
        Product::where('id', $p->id)->update(['stock' => 1]);

        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        Db::name('orders')->where('id', $order->id)->update(['status' => Order::STATUS_PAID]);
        (new OrderService())->deliverManually((int) $order->id);

        // 老明文卡在加密开启后仍正常发货(decrypt 对无前缀原样返回)
        $this->assertSame($plain, (string) Order::find($order->id)->delivered_content);
    }
}
