import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
const page = await ctx.newPage();
const apis = [];
page.on('response', async r => {
  try { const t = await r.text(); const s = t.trim(); if (s.startsWith('{') || s.startsWith('[')) { try { apis.push({ u: r.url().replace(/^https?:\/\/[^/]+/, ''), d: JSON.parse(t) }); } catch {} } } catch {}
});
await page.goto('https://fkdemo.jingsoft.com/shop/bbb', { waitUntil: 'load', timeout: 50000 }).catch(e => console.log('shop', e.message));
await page.waitForTimeout(5000);
console.log('SHOP API endpoints:\n' + apis.map(a => a.u).join('\n'));
const gl = apis.find(a => /goodslist/i.test(a.u));
const list = gl?.d?.data?.list || gl?.d?.data || [];
console.log('\nGOODS(' + list.length + '):\n' + list.map(g => `${g.name} | ${g.goods_key} | ¥${g.price}/${g.market_price} | type=${g.goods_type}`).join('\n'));
const g = list.find(x => x.goods_key && x.price > 0) || list.find(x => x.goods_key) || null;
if (g) {
  const before = apis.length;
  await page.goto('https://fkdemo.jingsoft.com/item/' + g.goods_key, { waitUntil: 'load', timeout: 50000 }).catch(e => console.log('item', e.message));
  await page.waitForTimeout(4500);
  console.log('\n===== ITEM[' + g.name + '] innerText =====\n' + (await page.locator('body').innerText().catch(() => '')).slice(0, 2500));
  await page.screenshot({ path: 'e2e/jf-item.png', fullPage: true }).catch(() => {});
  for (const a of apis.slice(before)) if (/goods|item|detail|coupon|buy|order/i.test(a.u)) console.log('\n→ ' + a.u + '\n' + JSON.stringify(a.d).slice(0, 2200));
}
writeFileSync('/tmp/jf-shop-apis.json', JSON.stringify(apis, null, 1));
console.log('\n[saved /tmp/jf-shop-apis.json,', apis.length, 'responses]');
await b.close();
