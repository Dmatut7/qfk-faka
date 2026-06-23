<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Order;
use app\service\DeliveryMailService;
use tests\Support\RecordingMailer;
use tests\Support\ThrowingMailer;
use tests\TestCase;

/**
 * 发货邮件通知(DeliveryMailService):组装正确 + fire-and-forget 隔离 + 邮箱/配置门控。
 */
class DeliveryMailTest extends TestCase
{
    protected function tearDown(): void
    {
        DeliveryMailService::setTestMailer(null); // 复位测试 mailer,避免泄漏到其它用例
        parent::tearDown();
    }

    /** 用未持久化的订单模型即可(notifyDelivered 只读属性、不入库)。 */
    private function order(array $o = []): Order
    {
        return new Order(array_merge([
            'order_no'          => 'OD-' . substr(uniqid(), -6),
            'buyer_email'       => 'buyer@example.com',
            'delivered_content' => "CARD-AAA\nCARD-BBB",
        ], $o));
    }

    public function testComposesAndSendsToBuyer(): void
    {
        $rec = new RecordingMailer();
        DeliveryMailService::setTestMailer($rec);

        (new DeliveryMailService())->notifyDelivered(
            $this->order(['order_no' => 'OD-X1', 'buyer_email' => 'b@x.com', 'delivered_content' => 'SECRET-123'])
        );

        $this->assertCount(1, $rec->sent);
        $mail = $rec->last();
        $this->assertSame('b@x.com', $mail['to']);
        $this->assertStringContainsString('OD-X1', $mail['subject'], '主题应含订单号');
        $this->assertStringContainsString('SECRET-123', $mail['html'], '正文应含发货内容');
    }

    public function testDeliverySafeWhenMailerThrows(): void
    {
        DeliveryMailService::setTestMailer(new ThrowingMailer());
        // notifyDelivered 必须吞掉异常,绝不向上抛(否则会冲垮发货主流程)
        (new DeliveryMailService())->notifyDelivered($this->order());
        $this->assertTrue(true, '抛异常的 mailer 不得让 notifyDelivered 抛出');
    }

    public function testSkipsEmptyOrInvalidEmail(): void
    {
        $rec = new RecordingMailer();
        DeliveryMailService::setTestMailer($rec);

        (new DeliveryMailService())->notifyDelivered($this->order(['buyer_email' => '']));
        (new DeliveryMailService())->notifyDelivered($this->order(['buyer_email' => 'not-an-email']));

        $this->assertCount(0, $rec->sent, '空/非法邮箱不应发送');
    }

    public function testNoSendWhenUnconfigured(): void
    {
        // 不注入测试 mailer:notify_on_deliver 默认关闭 → 构建 mailer 返回 null → 静默跳过、不抛
        (new DeliveryMailService())->notifyDelivered($this->order());
        $this->assertTrue(true);
    }
}
