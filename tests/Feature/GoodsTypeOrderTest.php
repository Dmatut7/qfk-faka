<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\common\BizException;
use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\service\OrderService;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 商品类型路由(增量2,关键路径):
 *  - 非卡密类(知识/资源/权益)下单不占 cards、无需库存,回调发 delivery_message 内容并结算;
 *  - 卡密类维持一卡一售(无卡仍 STOCK_NOT_ENOUGH),发货发卡密快照,行为不变。
 */
class GoodsTypeOrderTest extends TestCase
{
    private const KEY = 'secretkey';

    private Merchant $m;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant(['commission_rate' => '0.1000']);
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);
    }

    private function epaySign(array $params, string $key): string
    {
        unset($params['sign'], $params['sign_type']);
        $params = array_filter($params, static fn($v) => $v !== '' && $v !== null);
        ksort($params);
        $parts = [];
        foreach ($params as $k => $v) {
            $parts[] = $k . '=' . $v;
        }
        return md5(implode('&', $parts) . $key);
    }

    private function payAndNotify(Order $order, string $money): string
    {
        $payment = Payment::create([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $order->id,
            'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => $money, 'status' => Payment::STATUS_PENDING,
        ]);
        $params = [
            'pid' => '1001', 'out_trade_no' => $payment->payment_no,
            'trade_no' => 'CH_' . uniqid(), 'money' => $money,
            'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
        ];
        $params['sign'] = $this->epaySign($params, self::KEY);
        $params['sign_type'] = 'MD5';
        return $this->call('GET', '/pay/notify/epay', $params)->getContent();
    }

    public function testNonCardProductOrderableWithoutCards(): void
    {
        // 知识类商品,无卡密、stock=0,仍可下单(不报库存不足)
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '课程', 'price' => '10.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE, 'stock' => 0,
        ]);

        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        $this->assertSame(Order::STATUS_PENDING, (int) $order->status);
        $this->assertSame('10.00', $order->total_amount);
        // 非卡密:不应锁定任何卡
        $this->assertSame(0, Card::where('order_id', $order->id)->count());
    }

    public function testManualDeliverNonCardOrderUsesContentNotCardPool(): void
    {
        // 知识/资源类异常单(如延迟回调 closed_then_paid)补发应按内容发货,
        // 而非误走发卡路径在空卡池上报"库存不足"导致永远无法补发。
        $content = '课程地址 https://x/learn 提取码 6666';
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '课', 'price' => '10.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_KNOWLEDGE,
            'delivery_message' => $content, 'stock' => 0,
        ]);
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        Order::where('id', $order->id)->update(['status' => Order::STATUS_EXCEPTION]);

        (new OrderService())->deliverManually((int) $order->id);

        $fresh = Order::find($order->id);
        $this->assertSame(Order::STATUS_DELIVERED, (int) $fresh->status);
        $this->assertSame($content, $fresh->delivered_content);
        $this->assertSame(0, Card::where('order_id', $order->id)->count());
    }

    public function testNonCardCallbackDeliversDeliveryMessageAndSettles(): void
    {
        $content = "下载链接: https://cdn.example.com/file.zip\n提取码: 8888";
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '资源包', 'price' => '20.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_RESOURCE,
            'delivery_message' => $content, 'stock' => 0,
        ]);
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']); // 20.00

        $ack = $this->payAndNotify($order, '20.00');
        $this->assertSame('success', $ack);

        $fresh = Order::find($order->id);
        $this->assertSame(Order::STATUS_DELIVERED, (int) $fresh->status);
        // 非卡密发货内容 = 商品 delivery_message
        $this->assertSame($content, $fresh->delivered_content);
        // 不涉及任何卡
        $this->assertSame(0, Card::where('order_id', $order->id)->count());

        // 结算入账:商户余额 = 20 - 抽佣10% = 18.00(净额);两条流水
        $this->assertSame('18.00', Money::add((string) Merchant::find($this->m->id)->balance, '0'));
        $this->assertSame(1, MerchantFundLog::where('order_id', $order->id)->where('type', MerchantFundLog::TYPE_INCOME)->count());
        $this->assertSame(1, MerchantFundLog::where('order_id', $order->id)->where('type', MerchantFundLog::TYPE_COMMISSION)->count());

        // 买家查单返回 goods_type(供前端按类型标注发货内容),内容随发货快照返回
        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $order->order_no, 'email' => 'b@x.com']);
        $this->assertSame(Product::GOODS_TYPE_RESOURCE, (int) $q['data']['goods_type']);
        $this->assertSame($content, $q['data']['delivered_content']);
    }

    public function testRightsProductUsesCodePool(): void
    {
        // 权益类走码池(一权一售):导入 2 个权益码
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '会员权益', 'price' => '30.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_RIGHTS, 'stock' => 0,
        ]);
        $codes = [];
        for ($i = 0; $i < 2; $i++) {
            $s = 'RIGHT-' . $i . '-' . uniqid();
            $codes[] = $s;
            Card::create(['merchant_id' => $this->m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        }
        Product::where('id', $p->id)->update(['stock' => 2]);

        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
        // 权益类占码:1 个码被锁定
        $this->assertSame(1, Card::where('order_id', $order->id)->where('status', Card::STATUS_LOCKED)->count());

        $ack = $this->payAndNotify($order, (string) $order->total_amount);
        $this->assertSame('success', $ack);
        $fresh = Order::find($order->id);
        $this->assertSame(Order::STATUS_DELIVERED, (int) $fresh->status);
        // 发货内容 = 唯一权益码(来自码池,非 delivery_message)
        $this->assertContains($fresh->delivered_content, $codes);
        $this->assertSame(1, Card::where('order_id', $order->id)->where('status', Card::STATUS_SOLD)->count());
    }

    public function testRightsProductWithoutCodesRejected(): void
    {
        // 权益类无码 → 一权一售库存不足
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '权益', 'price' => '5.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_RIGHTS, 'stock' => 0,
        ]);
        try {
            (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
            $this->fail('权益无码应库存不足');
        } catch (BizException $e) {
            $this->assertSame(Code::STOCK_NOT_ENOUGH, $e->getBizCode());
        }
    }

    public function testCardProductStillRequiresCards(): void
    {
        // 卡密类(默认),无卡 → 下单库存不足(一卡一售不变)
        $p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '卡密商品', 'price' => '5.00',
            'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_CARD, 'stock' => 0,
        ]);
        try {
            (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'b@x.com']);
            $this->fail('卡密商品无卡应抛库存不足');
        } catch (BizException $e) {
            $this->assertSame(Code::STOCK_NOT_ENOUGH, $e->getBizCode());
        }
    }
}
