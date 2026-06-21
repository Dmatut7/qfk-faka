import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
const page = await ctx.newPage();
let goods = null; const apis = [];
page.on('response', async r => { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { try { const j = await r.json(); apis.push({ u: r.url().replace(/^https?:\/\/[^/]+/, ''), d: j }); if (r.url().includes('goodsList') && j?.data?.list) goods = j.data.list; } catch {} } });
await page.goto('https://fkdemo.jingsoft.com/shop/bbb', { waitUntil: 'networkidle', timeout: 50000 }).catch(e => console.log('shop', e.message));
await page.waitForTimeout(3000);
const g = (goods || []).find(x => x.price > 0 && x.goods_key) || (goods || [])[0];
console.log('picked:', g?.name, '| key:', g?.goods_key, '| price:', g?.price);
if (g) {
  await page.goto('https://fkdemo.jingsoft.com/item/' + g.goods_key, { waitUntil: 'networkidle', timeout: 50000 }).catch(e => console.log('item', e.message));
  await page.waitForTimeout(3500);
  const text = await page.locator('body').innerText().catch(() => '');
  console.log('\n===== ITEM innerText =====\n' + text.slice(0, 3500));
  await page.screenshot({ path: 'e2e/jf-item.png', fullPage: true }).catch(() => {});
  console.log('\n===== item/goods detail API =====');
  for (const a of apis) { if (/goods|item|detail|coupon|sku/i.test(a.u) && !a.u.includes('goodsList')) console.log('\n→ ' + a.u + '\n' + JSON.stringify(a.d).slice(0, 1800)); }
}
await b.close();
