<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\AccessToken;
use app\model\Merchant;
use app\model\MerchantFundLog;
use app\model\Order;
use app\model\Payment;
use app\model\PaymentChannel;
use app\model\Product;
use app\model\Withdrawal;
use app\util\Money;
use app\util\OrderNo;
use tests\TestCase;

/**
 * M2 支付/资金/令牌表 (T2.6)。
 */
class PaymentTablesTest extends TestCase
{
    private Merchant $m;
    private Order $o;

    protected function setUp(): void
    {
        parent::setUp();
        $u = uniqid();
        $this->m = Merchant::create(['username' => 'm_' . $u, 'password' => 'x', 'store_name' => 's', 'store_slug' => 'sl_' . $u]);
        $p = Product::create(['merchant_id' => $this->m->id, 'title' => 'c', 'price' => '5.00']);
        $this->o = Order::create([
            'order_no' => OrderNo::generate(), 'merchant_id' => $this->m->id, 'product_id' => $p->id,
            'buyer_email' => 'b@x.com', 'quantity' => 1, 'unit_price' => '5.00', 'total_amount' => '5.00',
            'expire_at' => date('Y-m-d H:i:s', time() + 900),
        ]);
    }

    private function payment(array $o = []): Payment
    {
        return Payment::create(array_merge([
            'payment_no' => OrderNo::generate('PAY'), 'order_id' => $this->o->id,
            'merchant_id' => $this->m->id, 'channel' => 'epay', 'amount' => '5.00',
        ], $o));
    }

    public function testPaymentNoUnique(): void
    {
        $p = $this->payment();
        $this->expectException(\Exception::class);
        $this->payment(['payment_no' => $p->payment_no]);
    }

    public function testChannelTradeNoUniqueButNullAllowedMultiple(): void
    {
        // 两条 channel_trade_no=NULL 允许共存(NULL 不参与唯一约束)
        $this->payment();
        $this->payment();
        $this->assertSame(2, Payment::where('order_id', $this->o->id)->count());

        // 相同 channel + trade_no 冲突
        $this->payment(['channel_trade_no' => 'TRADE-1']);
        $this->expectException(\Exception::class);
        $this->payment(['channel_trade_no' => 'TRADE-1']);
    }

    public function testPaymentChannelJsonConfig(): void
    {
        $ch = PaymentChannel::create([
            'code' => 'epay_' . uniqid(), 'name' => '易支付', 'driver' => 'EpayDriver',
            'config' => ['app_id' => '1001', 'key' => 'secret', 'gateway' => 'https://pay.example.com'],
        ]);
        $found = PaymentChannel::find($ch->id);
        $this->assertIsArray($found->config);
        $this->assertSame('1001', $found->config['app_id']);
        $this->assertTrue($found->isEnabled());
    }

    public function testFundLogReversalUsesDistinctTypesUnderUniq(): void
    {
        // 结算两条:订单收入 + 平台佣金
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_INCOME, 'amount' => '4.71', 'balance_after' => '4.71', 'order_id' => $this->o->id]);
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_COMMISSION, 'amount' => '-0.29', 'balance_after' => '4.71', 'order_id' => $this->o->id]);
        // 无订单(提现)多条允许(NULL order_id 不受 uniq 约束)
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_WITHDRAW, 'amount' => '-1.00', 'balance_after' => '3.71']);
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_WITHDRAW, 'amount' => '-1.00', 'balance_after' => '2.71']);

        // 退款反向:佣金回冲用**独立** TYPE_REFUND_COMMISSION(与结算 COMMISSION 不同 type,
        // 故 uniq(order_id,type) 不冲突,可与结算流水共存)+ 一条 TYPE_REFUND 冲收入。
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_REFUND_COMMISSION, 'amount' => '0.29', 'balance_after' => '0.00', 'order_id' => $this->o->id]);
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_REFUND, 'amount' => '-4.71', 'balance_after' => '-0.29', 'order_id' => $this->o->id]);
        $this->assertSame(6, MerchantFundLog::where('merchant_id', $this->m->id)->count());
        // 该订单佣金净额 = COMMISSION(-0.29) + REFUND_COMMISSION(+0.29) = 0
        $net = Money::add(
            (string) MerchantFundLog::where('order_id', $this->o->id)->whereIn('type', [MerchantFundLog::TYPE_COMMISSION, MerchantFundLog::TYPE_REFUND_COMMISSION])->sum('amount'),
            '0'
        );
        $this->assertSame('0.00', $net);

        // 同订单同类型再插一条 → uniq(order_id,type) 拒绝(结算幂等 DB 级兜底)
        $this->expectException(\think\db\exception\PDOException::class);
        MerchantFundLog::create(['merchant_id' => $this->m->id, 'type' => MerchantFundLog::TYPE_COMMISSION, 'amount' => '-0.29', 'balance_after' => '0', 'order_id' => $this->o->id]);
    }

    public function testWithdrawalDefaults(): void
    {
        $w = Withdrawal::create(['merchant_id' => $this->m->id, 'amount' => '10.00', 'account_info' => 'alipay:xx']);
        $this->assertSame(Withdrawal::STATUS_PENDING, Withdrawal::find($w->id)->status);
        $this->assertSame('0.00', Withdrawal::find($w->id)->fee);
    }

    public function testAccessTokenUnique(): void
    {
        $hash = hash('sha256', 'tok_' . uniqid());
        AccessToken::create(['owner_type' => AccessToken::OWNER_MERCHANT, 'owner_id' => $this->m->id, 'token_hash' => $hash, 'expires_at' => date('Y-m-d H:i:s', time() + 3600)]);
        $this->expectException(\Exception::class);
        AccessToken::create(['owner_type' => AccessToken::OWNER_ADMIN, 'owner_id' => 1, 'token_hash' => $hash, 'expires_at' => date('Y-m-d H:i:s', time() + 3600)]);
    }
}
