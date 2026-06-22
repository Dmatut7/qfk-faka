<?php
declare(strict_types=1);

namespace tests\Feature;

use app\common\BizException;
use app\common\Code;
use app\model\BuyerBlacklist;
use app\model\Card;
use app\model\Product;
use app\service\OrderService;
use tests\TestCase;
use think\facade\Db;

/**
 * 买家黑名单(平台级):后台 CRUD + 下单拦截。
 */
class BuyerBlacklistTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->token = $this->makeAdminToken();
    }

    private function hdr(): array
    {
        return $this->bearer($this->token);
    }

    public function testAdminAddNormalizesAndLists(): void
    {
        $r = $this->callJson('POST', '/admin/blacklist', ['email' => 'BAD@X.com', 'reason' => '恶意下单'], $this->hdr());
        $this->assertSame(0, $r['code']);
        $this->assertSame('bad@x.com', $r['data']['email']); // 归一小写

        $list = $this->callJson('GET', '/admin/blacklist', [], $this->hdr());
        $this->assertSame('bad@x.com', $list['data']['items'][0]['email']);
    }

    public function testAddIsIdempotent(): void
    {
        $svc = new \app\service\BuyerBlacklistService();
        $svc->add('dup@x.com', 'r1');
        $svc->add('DUP@x.com', 'r2'); // 同邮箱不同大小写
        $this->assertSame(1, BuyerBlacklist::where('email', 'dup@x.com')->count());
    }

    public function testBlockedEmailCannotOrder(): void
    {
        $m = $this->makeMerchant();
        $p = Product::create(['merchant_id' => $m->id, 'title' => 'c', 'price' => '5.00', 'status' => Product::STATUS_ON, 'stock' => 0]);
        $s = 'BL-' . uniqid();
        Card::create(['merchant_id' => $m->id, 'product_id' => $p->id, 'secret' => $s, 'secret_hash' => Card::hashSecret($s)]);
        Product::where('id', $p->id)->update(['stock' => 1]);

        (new \app\service\BuyerBlacklistService())->add('blocked@x.com');

        // 黑名单邮箱(任意大小写)下单被拦截
        try {
            (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'Blocked@x.com']);
            $this->fail('黑名单买家应被拦截');
        } catch (BizException $e) {
            $this->assertSame(Code::FORBIDDEN, $e->getBizCode());
        }
        // 卡未被占用(拦在事务前)
        $this->assertSame(Card::STATUS_UNSOLD, (int) Card::where('product_id', $p->id)->find()->status);

        // 非黑名单邮箱正常下单
        $order = (new OrderService())->create(['product_id' => $p->id, 'quantity' => 1, 'buyer_email' => 'ok@x.com']);
        $this->assertGreaterThan(0, (int) $order->id);
    }

    public function testRemoveLiftsBlock(): void
    {
        $svc = new \app\service\BuyerBlacklistService();
        $b = $svc->add('lift@x.com');
        $this->assertTrue($svc->isBlocked('lift@x.com'));
        $svc->remove((int) $b->id);
        $this->assertFalse($svc->isBlocked('lift@x.com'));
    }

    public function testEndpointsRequireAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/blacklist')->getCode());
        $this->assertSame(401, $this->call('POST', '/admin/blacklist', ['email' => 'a@b.com'])->getCode());
    }
}
