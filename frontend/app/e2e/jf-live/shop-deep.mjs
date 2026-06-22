/* 店铺 shop/bbb 深抓:滚动加载商品 + 商品详情 + 捕获 shopApi 商品/分类/类型数据模型 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const DIR = 'e2e/jf-live';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const api = [];
page.on('response', async (r) => {
  try { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { let t = await r.text(); if (t.length > 9000) t = t.slice(0, 9000) + '…'; api.push({ url: r.url().replace('https://fkdemo.jingsoft.com', ''), status: r.status(), body: t }); } } catch {}
});
try {
  await page.goto('https://fkdemo.jingsoft.com/shop/bbb', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(7000);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 1200).catch(() => {}); await page.waitForTimeout(1500); }
  await page.screenshot({ path: `${DIR}/shop-home.png`, fullPage: true }).catch(() => {});
  const home = await page.evaluate(() => ({ url: location.href, title: document.title, text: document.body.innerText.slice(0, 7000) }));
  writeFileSync(`${DIR}/shop-home.txt`, `URL ${home.url}\nTITLE ${home.title}\n\n${home.text}`);
  // 点第一个商品
  const g = page.locator('a[href*="goods"], a[href*="buy"], a[href*="detail"], [class*=goods], [class*=product]').filter({ hasText: /.+/ }).first();
  if (await g.count()) {
    await g.click().catch(() => {});
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${DIR}/shop-detail.png`, fullPage: true }).catch(() => {});
    writeFileSync(`${DIR}/shop-detail.txt`, await page.evaluate(() => `URL ${location.href}\n\n${document.body.innerText.slice(0, 6000)}`));
  }
  console.log('shop-deep done, api', api.length);
} catch (e) { console.error('shop-deep error:', e.message); }
finally {
  writeFileSync(`${DIR}/shop-api.json`, JSON.stringify(api, null, 2));
  console.log('shop api urls:\n' + [...new Set(api.map((a) => a.url.replace(/\?.*/, '')))].join('\n'));
  await b.close();
}
