<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Merchant;
use tests\TestCase;

/**
 * 店铺主题模板:商户可选预设主题,非法回退 default;店铺前台下发 theme。
 */
class ShopThemeTest extends TestCase
{
    public function testMerchantSetsValidTheme(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        $r = $this->callJson('POST', '/merchant/shop', ['theme' => 'emerald'], $tok);
        $this->assertSame(0, $r['code']);
        $this->assertSame('emerald', $r['data']['theme']);
        $this->assertSame('emerald', Merchant::find($m->id)->theme);
    }

    public function testInvalidThemeFallsBackToDefault(): void
    {
        $m = $this->makeMerchant();
        $tok = $this->bearer($this->merchantToken((int) $m->id));
        $this->callJson('POST', '/merchant/shop', ['theme' => 'rainbow_unicorn'], $tok);
        $this->assertSame('default', Merchant::find($m->id)->theme);
    }

    public function testStorefrontExposesTheme(): void
    {
        $m = $this->makeMerchant(['store_slug' => 'th_' . uniqid()]);
        Merchant::where('id', $m->id)->update(['theme' => 'violet']);
        $body = $this->callJson('GET', '/s/' . $m->store_slug);
        $this->assertSame('violet', $body['data']['store']['theme']);
    }
}
