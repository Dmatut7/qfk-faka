<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Order;
use app\model\PaymentChannel;
use app\model\Product;
use tests\TestCase;

/**
 * 端到端发货链路 (T6.6):下单 → 发起支付 → 模拟回调 → 前台查询拿到卡密。
 */
class PaymentE2ETest extends TestCase
{
    private const KEY = 'secretkey';

    public function testFullPurchaseFlow(): void
    {
        $m = $this->makeMerchant(['commission_rate' => '0.0588']);
        $p = Product::create(['merchant_id' => $m->id, 'title' => '充值卡', 'price' => '9.99', 'status' => Product::STATUS_ON, 'stock' => 0]);
        $secret = 'CARD-SECRET-' . uniqid();
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $secret, 'secret_hash' => Card::hashSecret($secret)]);
        Product::where('id', $p->id)->update(['stock' => 1]);
        PaymentChannel::create([
            'code' => 'epay', 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['pid' => '1001', 'key' => self::KEY, 'gateway' => 'https://pay.example.com'],
            'status' => PaymentChannel::STATUS_ENABLED,
        ]);

        // 1) 下单
        $created = $this->callJson('POST', '/buyer/order', ['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'buyer@x.com']);
        $this->assertSame(0, $created['code']);
        $orderNo = $created['data']['order_no'];
        $this->assertSame('9.99', $created['data']['total_amount']);

        // 2) 发起支付
        $pay = $this->callJson('POST', '/buyer/order/' . $orderNo . '/pay', ['channel' => 'epay']);
        $this->assertSame(0, $pay['code']);
        $paymentNo = $pay['data']['payment_no'];

        // 3) 模拟渠道回调(正确签名)
        $cb = [
            'pid' => '1001', 'out_trade_no' => $paymentNo, 'trade_no' => 'CHX' . uniqid(),
            'money' => '9.99', 'trade_status' => 'TRADE_SUCCESS', 'type' => 'alipay', 'name' => '订单',
        ];
        $cb['sign'] = $this->epaySign($cb, self::KEY);
        $cb['sign_type'] = 'MD5';
        $ack = $this->call('GET', '/pay/notify/epay', $cb)->getContent();
        $this->assertSame('success', $ack);

        // 订单已发货
        $this->assertSame(Order::STATUS_DELIVERED, (int) Order::where('order_no', $orderNo)->value('status'));

        // 4) 前台查询拿到卡密
        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $orderNo, 'email' => 'buyer@x.com']);
        $this->assertSame(Order::STATUS_DELIVERED, $q['data']['status']);
        $this->assertSame([$secret], $q['data']['cards'], '买家应拿到正确卡密');
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
}
