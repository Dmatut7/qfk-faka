<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use app\model\Order;
use app\model\Product;
use app\service\MerchantApiService;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 商户开放 API:凭据生成 + 签名鉴权(app_key+timestamp+HMAC)+ 只读端点 + 商户隔离。
 */
class MerchantApiTest extends TestCase
{
    private function signed(array $params, string $secret): array
    {
        $params['sign'] = (new MerchantApiService())->sign($params, $secret);
        return $params;
    }

    public function testGenerateCredentials(): void
    {
        $m = $this->makeMerchant();
        $r = $this->callJson('POST', '/merchant/api-credentials', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertSame(0, $r['code']);
        $this->assertStringStartsWith('mk_', $r['data']['api_key']);
        $this->assertNotEmpty($r['data']['api_secret']);
        $this->assertSame($r['data']['api_key'], Merchant::find($m->id)->api_key);
    }

    public function testSignedProductsRequestSucceeds(): void
    {
        $m = $this->makeMerchant();
        $creds = (new MerchantApiService())->generateCredentials((int) $m->id);
        Product::create(['merchant_id' => $m->id, 'title' => 'P1', 'price' => '9.90', 'status' => Product::STATUS_ON, 'stock' => 5]);

        $params = $this->signed(['app_key' => $creds['api_key'], 'timestamp' => time()], $creds['api_secret']);
        $r = $this->callJson('POST', '/api/products', $params);
        $this->assertSame(0, $r['code']);
        $this->assertCount(1, $r['data']['items']);
        $this->assertSame('P1', $r['data']['items'][0]['title']);
        $this->assertSame(5, (int) $r['data']['items'][0]['stock']);
    }

    public function testBadSignRejected(): void
    {
        $m = $this->makeMerchant();
        $creds = (new MerchantApiService())->generateCredentials((int) $m->id);
        $params = ['app_key' => $creds['api_key'], 'timestamp' => time(), 'sign' => 'deadbeef'];
        $this->assertNotSame(0, $this->callJson('POST', '/api/products', $params)['code'], '错误签名应被拒');
    }

    public function testExpiredTimestampRejected(): void
    {
        $m = $this->makeMerchant();
        $creds = (new MerchantApiService())->generateCredentials((int) $m->id);
        $params = $this->signed(['app_key' => $creds['api_key'], 'timestamp' => time() - 1000], $creds['api_secret']);
        $this->assertNotSame(0, $this->callJson('POST', '/api/products', $params)['code'], '过期时间戳应被拒(防重放)');
    }

    public function testUnknownAppKeyRejected(): void
    {
        $params = $this->signed(['app_key' => 'mk_nonexistent', 'timestamp' => time()], 'whatever');
        $this->assertNotSame(0, $this->callJson('POST', '/api/products', $params)['code'], '无效 app_key 应被拒');
    }

    public function testOrderQueryScopedToOwnMerchant(): void
    {
        $a = $this->makeMerchant();
        $b = $this->makeMerchant();
        $credsA = (new MerchantApiService())->generateCredentials((int) $a->id);
        // 一单属于商户 B
        $pB = Product::create(['merchant_id' => $b->id, 'title' => 'b', 'price' => '1.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        $bNo = OrderNo::generate('OD');
        Order::create([
            'order_no' => $bNo, 'merchant_id' => $b->id, 'product_id' => $pB->id, 'buyer_email' => 'x@x.com',
            'quantity' => 1, 'unit_price' => '1.00', 'total_amount' => '1.00', 'status' => Order::STATUS_DELIVERED,
            'expire_at' => date('Y-m-d H:i:s', time() + 3600),
        ]);

        // 商户 A 用 API 查 B 的订单 → 不存在(隔离)
        $params = $this->signed(['app_key' => $credsA['api_key'], 'timestamp' => time(), 'order_no' => $bNo], $credsA['api_secret']);
        $this->assertNotSame(0, $this->callJson('POST', '/api/order/query', $params)['code'], 'A 不得查到 B 的订单');
    }

    public function testApiSecretNeverLeakedInMerchantResponse(): void
    {
        $m = $this->makeMerchant();
        (new MerchantApiService())->generateCredentials((int) $m->id);
        $me = $this->callJson('GET', '/merchant/me', [], $this->bearer($this->merchantToken((int) $m->id)));
        $this->assertArrayNotHasKey('api_secret', $me['data'], 'api_secret 绝不下发');
    }
}
