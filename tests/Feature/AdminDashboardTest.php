<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Card;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Product;
use app\service\AdminViewService;
use app\service\MerchantWalletService;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;

/**
 * 平台仪表盘聚合 GET /admin/dashboard。
 *
 * 用例在事务内运行(回滚隔离)。为不依赖测试库初始为空,
 * 先抓取基线聚合,再插入已知数据,断言"基线 + 增量"完全一致。
 */
class AdminDashboardTest extends TestCase
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

    private function order(int $merchantId, int $productId, int $status, string $amount, ?string $createTime = null): Order
    {
        $o = Order::create([
            'order_no'     => OrderNo::generate(),
            'merchant_id'  => $merchantId,
            'product_id'   => $productId,
            'buyer_email'  => 'b@example.com',
            'quantity'     => 1,
            'unit_price'   => $amount,
            'total_amount' => $amount,
            'status'       => $status,
            'expire_at'    => date('Y-m-d H:i:s', time() + 900),
        ]);
        if ($createTime !== null) {
            Order::where('id', $o->id)->update(['create_time' => $createTime]);
        }
        return $o;
    }

    /** 平台佣金流水(amount 存负数,口径同 AdminReportService),可指定 create_time */
    private function commissionLog(int $merchantId, string $negAmount, ?string $createTime = null): MerchantFundLog
    {
        $log = MerchantFundLog::create([
            'merchant_id'   => $merchantId,
            'type'          => MerchantFundLog::TYPE_COMMISSION,
            'amount'        => $negAmount,
            'balance_after' => '0.00',
            'remark'        => '平台佣金',
        ]);
        if ($createTime !== null) {
            MerchantFundLog::where('id', $log->id)->update(['create_time' => $createTime]);
        }
        return $log;
    }

    private function card(int $merchantId, int $productId, int $status): Card
    {
        $secret = uniqid('s', true);
        return Card::create([
            'merchant_id' => $merchantId,
            'product_id'  => $productId,
            'secret'      => $secret,
            'secret_hash' => Card::hashSecret($secret),
            'status'      => $status,
        ]);
    }

    public function testDashboardRequiresAdminAuth(): void
    {
        $this->assertSame(401, $this->call('GET', '/admin/dashboard')->getCode());
    }

    public function testDashboardAggregatesMatchRealData(): void
    {
        $svc = new AdminViewService();
        // 基线:插入前的真实聚合
        $base = $svc->dashboard();

        // ---- 商户:pending 1、active 2(其一用于挂订单/商品/卡)、frozen 1 ----
        $this->makeMerchant(['status' => Merchant::STATUS_PENDING]);
        $mActive = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $this->makeMerchant(['status' => Merchant::STATUS_FROZEN]);
        $mid = (int) $mActive->id;

        // ---- 商品:在售 2、下架 1 ----
        $pOn1 = Product::create(['merchant_id' => $mid, 'title' => 'a', 'price' => '5.00', 'status' => Product::STATUS_ON]);
        Product::create(['merchant_id' => $mid, 'title' => 'b', 'price' => '5.00', 'status' => Product::STATUS_ON]);
        Product::create(['merchant_id' => $mid, 'title' => 'c', 'price' => '5.00', 'status' => Product::STATUS_OFF]);
        $pid = (int) $pOn1->id;

        // ---- 卡密:未售 3、已售 1 ----
        $this->card($mid, $pid, Card::STATUS_UNSOLD);
        $this->card($mid, $pid, Card::STATUS_UNSOLD);
        $this->card($mid, $pid, Card::STATUS_UNSOLD);
        $this->card($mid, $pid, Card::STATUS_SOLD);

        $todayMid = date('Y-m-d 12:00:00');
        $yesterday = date('Y-m-d 12:00:00', strtotime('-1 day'));

        // ---- 订单 ----
        // 今日已发货 2 笔:40 + 60 = 销售今日 100;计入销售总额
        $this->order($mid, $pid, Order::STATUS_DELIVERED, '40.00', $todayMid);
        $this->order($mid, $pid, Order::STATUS_DELIVERED, '60.00', $todayMid);
        // 昨日已发货 1 笔:25,计入销售总额、不计今日
        $this->order($mid, $pid, Order::STATUS_DELIVERED, '25.00', $yesterday);
        // 今日已支付 1 笔:99(paid 计数 +1、今日订单 +1,不计销售额)
        $this->order($mid, $pid, Order::STATUS_PAID, '99.00', $todayMid);
        // 昨日待支付 1 笔(总订单 +1,昨日订单 +1,不计今日、不计 paid/delivered)
        $this->order($mid, $pid, Order::STATUS_PENDING, '7.00', $yesterday);
        // 今日异常待人工 1 笔(总订单 +1、今日订单 +1、exception +1)
        $this->order($mid, $pid, Order::STATUS_EXCEPTION, '8.00', $todayMid);

        // ---- 平台抽佣流水(amount 负数)----
        // 今日:-10 + -5 = 今日佣金 15;昨日:-3,计入总额、不计今日
        $this->commissionLog($mid, '-10.00', $todayMid);
        $this->commissionLog($mid, '-5.00', $todayMid);
        $this->commissionLog($mid, '-3.00', $yesterday);

        // ---- 提现:待审 2 笔(20 + 30 = 50);非待审不计 ----
        $wallet = new MerchantWalletService();
        $mw = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE, 'balance' => '1000.00']);
        $wallet->applyWithdrawal((int) $mw->id, '20.00', 'alipay:a@b');
        $w2 = $wallet->applyWithdrawal((int) $mw->id, '30.00', 'alipay:a@b');
        // 第三笔置为已打款,不计入 pending
        $wDone = $wallet->applyWithdrawal((int) $mw->id, '10.00', 'alipay:a@b');
        (new \app\service\AdminWithdrawService())->approve((int) $wDone->id);

        // 通过 HTTP 端点取聚合
        $r = $this->callJson('GET', '/admin/dashboard', [], $this->hdr());
        $this->assertSame(0, $r['code']);
        $d = $r['data'];

        // merchants: 本测试新增 5 个商户(pending1/active3(含 mw)/frozen1),全部今日注册
        $this->assertSame($base['merchants']['total'] + 5, $d['merchants']['total']);
        $this->assertSame($base['merchants']['pending'] + 1, $d['merchants']['pending']);
        $this->assertSame($base['merchants']['active'] + 3, $d['merchants']['active']);
        $this->assertSame($base['merchants']['frozen'] + 1, $d['merchants']['frozen']);
        $this->assertSame($base['merchants']['today'] + 5, $d['merchants']['today']);

        // orders: 总 +6、今日 +4(2 delivered + 1 paid + 1 exception)、昨日 +2(1 delivered + 1 pending)、
        //         paid +1、delivered +3、exception +1
        $this->assertSame($base['orders']['total'] + 6, $d['orders']['total']);
        $this->assertSame($base['orders']['today'] + 4, $d['orders']['today']);
        $this->assertSame($base['orders']['yesterday'] + 2, $d['orders']['yesterday']);
        $this->assertSame($base['orders']['paid'] + 1, $d['orders']['paid']);
        $this->assertSame($base['orders']['delivered'] + 3, $d['orders']['delivered']);
        $this->assertSame($base['orders']['exception'] + 1, $d['orders']['exception']);

        // sales(已发货合计,Money 字符串):总 +125(40+60+25)、今日 +100(40+60)、昨日 +25
        $this->assertSame(Money::add($base['sales']['total'], '125.00'), $d['sales']['total']);
        $this->assertSame(Money::add($base['sales']['today'], '100.00'), $d['sales']['today']);
        $this->assertSame(Money::add($base['sales']['yesterday'], '25.00'), $d['sales']['yesterday']);

        // withdrawals: 待审 +2、金额 +50.00
        $this->assertSame($base['withdrawals']['pending_count'] + 2, $d['withdrawals']['pending_count']);
        $this->assertSame(Money::add($base['withdrawals']['pending_amount'], '50.00'), $d['withdrawals']['pending_amount']);

        // products: 总 +3、在售 +2
        $this->assertSame($base['products']['total'] + 3, $d['products']['total']);
        $this->assertSame($base['products']['on_sale'] + 2, $d['products']['on_sale']);

        // cards: 未售 +3
        $this->assertSame($base['cards']['unsold'] + 3, $d['cards']['unsold']);

        // commission(平台抽佣,Money 字符串,佣金流水取绝对值):总 +18(10+5+3)、今日 +15(10+5)
        $this->assertSame(Money::add($base['commission']['total'], '18.00'), $d['commission']['total']);
        $this->assertSame(Money::add($base['commission']['today'], '15.00'), $d['commission']['today']);

        // profit(平台利润 = 抽佣收入,四档):今日 +15、昨日 +3、累计 +18
        $this->assertSame(Money::add($base['profit']['today'], '15.00'), $d['profit']['today']);
        $this->assertSame(Money::add($base['profit']['yesterday'], '3.00'), $d['profit']['yesterday']);
        $this->assertSame(Money::add($base['profit']['total'], '18.00'), $d['profit']['total']);
        // 本月:含今日 15;昨日 3 是否计入取决于昨日是否同月(月初边界)
        $monthDelta = (date('Y-m') === date('Y-m', strtotime('-1 day'))) ? '18.00' : '15.00';
        $this->assertSame(Money::add($base['profit']['month'], $monthDelta), $d['profit']['month']);

        // complaints:新增 1 条平台介入中投诉 → active +1、intervene +1
        \app\model\Complaint::create([
            'order_id' => 1, 'order_no' => 'X', 'merchant_id' => $mid, 'buyer_email' => 'b@x.com',
            'type' => 4, 'description' => 'x', 'status' => \app\model\Complaint::STATUS_INTERVENE,
        ]);
        $d2 = (new AdminViewService())->dashboard();
        $this->assertSame($base['complaints']['active'] + 1, $d2['complaints']['active']);
        $this->assertSame($base['complaints']['intervene'] + 1, $d2['complaints']['intervene']);

        // 防止未使用变量被静态分析误判;同时验证对象确实落库
        $this->assertGreaterThan(0, (int) $w2->id);
        $this->assertGreaterThan(0, (int) $wDone->id);
    }
}
