/* 抓鲸发卡真实店铺 shop/bbb:首页 + 商品详情,截图 + 文本 + shopApi 数据模型 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const DIR = 'e2e/jf-live';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const api = [];
page.on('response', async (r) => {
  try { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { let t = await r.text(); if (t.length > 4000) t = t.slice(0, 4000) + '…'; api.push({ url: r.url(), status: r.status(), body: t }); } } catch {}
});
try {
  await page.goto('https://fkdemo.jingsoft.com/shop/bbb', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${DIR}/shop-home.png`, fullPage: true }).catch(() => {});
  const home = await page.evaluate(() => ({ url: location.href, title: document.title, text: document.body.innerText.slice(0, 6000) }));
  writeFileSync(`${DIR}/shop-home.txt`, `URL ${home.url}\nTITLE ${home.title}\n\n${home.text}`);
  const items = await page.evaluate(() => [...document.querySelectorAll('a, [class*=goods], [class*=product], [class*=item]')]
    .map((e) => ({ t: (e.innerText || '').trim().slice(0, 40), href: e.getAttribute ? e.getAttribute('href') : null })).filter((x) => x.t).slice(0, 60));
  writeFileSync(`${DIR}/shop-items.json`, JSON.stringify(items, null, 2));
  // 进第一个商品详情
  const g = page.locator('a[href*="goods"], a[href*="buy"], a[href*="detail"], [class*=goods-item], [class*=product-item]').first();
  if (await g.count()) {
    await g.click().catch(() => {});
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${DIR}/shop-detail.png`, fullPage: true }).catch(() => {});
    const det = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 6000) }));
    writeFileSync(`${DIR}/shop-detail.txt`, `URL ${det.url}\n\n${det.text}`);
  }
  console.log('shop: items', items.length, '| api', api.length);
} catch (e) { console.error('shop error:', e.message); }
finally {
  writeFileSync(`${DIR}/shop-api.json`, JSON.stringify(api, null, 2));
  console.log('shop api urls:\n' + [...new Set(api.map((a) => a.url.replace(/\?.*/, '').replace('https://fkdemo.jingsoft.com', '')))].join('\n'));
  await b.close();
}
