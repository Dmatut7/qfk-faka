<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\Code;
use app\model\Order;
use app\model\Product;
use app\service\DownloadService;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 资源类下载防盗链:已发货资源订单签发限时签名链,校验通过 302 跳真实地址;过期/篡改/非资源单拒。
 */
class ResourceDownloadTest extends TestCase
{
    private $m;
    private $p;

    protected function setUp(): void
    {
        parent::setUp();
        $this->m = $this->makeMerchant();
        $this->p = Product::create([
            'merchant_id' => $this->m->id, 'title' => '资源', 'price' => '5.00', 'status' => Product::STATUS_ON,
            'goods_type' => Product::GOODS_TYPE_RESOURCE, 'resource_url' => 'https://cdn.example.com/secret/file.zip',
        ]);
    }

    private function resourceOrder(int $status = Order::STATUS_DELIVERED, string $email = 'b@x.com'): Order
    {
        return Order::create([
            'order_no' => OrderNo::generate(), 'merchant_id' => $this->m->id, 'product_id' => $this->p->id,
            'goods_type' => Product::GOODS_TYPE_RESOURCE, 'buyer_email' => $email, 'quantity' => 1,
            'unit_price' => '5.00', 'total_amount' => '5.00', 'status' => $status,
            'expire_at' => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    public function testQueryReturnsSignedDownloadLink(): void
    {
        $order = $this->resourceOrder();
        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $order->order_no, 'email' => 'b@x.com']);
        $this->assertSame(0, $q['code']);
        $this->assertArrayHasKey('download_url', $q['data']);
        $this->assertStringContainsString('/buyer/download/', $q['data']['download_url']);
        $this->assertStringContainsString('token=', $q['data']['download_url']);
    }

    public function testValidLinkRedirectsToRealUrl(): void
    {
        $order = $this->resourceOrder();
        $link = (new DownloadService())->issueLink($order); // /buyer/download/NO?expires=..&token=..
        parse_str(parse_url($link, PHP_URL_QUERY), $qs);

        $resp = $this->call('GET', '/buyer/download/' . $order->order_no, ['expires' => $qs['expires'], 'token' => $qs['token']]);
        $this->assertSame(302, $resp->getCode());
        $this->assertSame('https://cdn.example.com/secret/file.zip', $resp->getHeader('Location'));
    }

    public function testForgedTokenRejected(): void
    {
        $order = $this->resourceOrder();
        $resp = $this->call('GET', '/buyer/download/' . $order->order_no, ['expires' => time() + 600, 'token' => 'forged']);
        $this->assertSame(403, $resp->getCode());
    }

    public function testExpiredLinkRejected(): void
    {
        $order = $this->resourceOrder();
        // 用真实签名但 expires 在过去
        $svc = new DownloadService();
        $past = time() - 10;
        $ref = new \ReflectionMethod($svc, 'sign');
        $ref->setAccessible(true);
        $token = $ref->invoke($svc, $order->order_no, $past);

        $r = $this->callJson('GET', '/buyer/download/' . $order->order_no, ['expires' => $past, 'token' => $token]);
        $this->assertSame(Code::STATE_INVALID, $r['code']);
    }

    public function testNonResourceOrderHasNoLink(): void
    {
        // 卡密类订单查单不应带 download_url
        $cp = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '5.00', 'status' => Product::STATUS_ON, 'goods_type' => Product::GOODS_TYPE_CARD]);
        $order = Order::create([
            'order_no' => OrderNo::generate(), 'merchant_id' => $this->m->id, 'product_id' => $cp->id, 'goods_type' => Product::GOODS_TYPE_CARD,
            'buyer_email' => 'b@x.com', 'quantity' => 1, 'unit_price' => '5.00', 'total_amount' => '5.00',
            'status' => Order::STATUS_DELIVERED, 'expire_at' => date('Y-m-d H:i:s', time() + 900), 'delivered_content' => 'SECRET-CARD',
        ]);
        $q = $this->callJson('POST', '/buyer/order/query', ['order_no' => $order->order_no, 'email' => 'b@x.com']);
        $this->assertArrayNotHasKey('download_url', $q['data']);
    }
}
