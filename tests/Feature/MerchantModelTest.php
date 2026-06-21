<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use tests\TestCase;

/**
 * 商户表/模型 (T2.2)。
 */
class MerchantModelTest extends TestCase
{
    private function makeMerchant(array $override = []): Merchant
    {
        $u = uniqid();
        return Merchant::create(array_merge([
            'username'   => 'm_' . $u,
            'password'   => password_hash('pw', PASSWORD_BCRYPT),
            'store_name' => '小店',
            'store_slug' => 'slug_' . $u,
        ], $override));
    }

    public function testDefaultsAndCrud(): void
    {
        $m = $this->makeMerchant();
        $found = Merchant::find($m->id);

        $this->assertSame(Merchant::STATUS_PENDING, $found->status, '默认待审核');
        $this->assertFalse($found->isActive());
        $this->assertSame('0.00', $found->balance);
        $this->assertSame('0.00', $found->frozen_balance);
        $this->assertSame('0.0000', $found->commission_rate);
        $this->assertArrayNotHasKey('password', $found->toArray());
        $this->assertArrayNotHasKey('api_secret', $found->toArray());
    }

    public function testUsernameUnique(): void
    {
        $m = $this->makeMerchant();
        $this->expectException(\Exception::class);
        $this->makeMerchant(['username' => $m->username]);
    }

    public function testSlugUnique(): void
    {
        $m = $this->makeMerchant();
        $this->expectException(\Exception::class);
        $this->makeMerchant(['store_slug' => $m->store_slug]);
    }

    public function testActiveStatus(): void
    {
        $m = $this->makeMerchant(['status' => Merchant::STATUS_ACTIVE]);
        $this->assertTrue(Merchant::find($m->id)->isActive());
    }
}
