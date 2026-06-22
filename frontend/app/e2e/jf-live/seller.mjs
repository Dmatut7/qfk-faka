/* 找鲸发卡商户后台(卖家中心):前台登录 666666 → 我的小店/卖家中心,捕获菜单 + sellerApi 模型 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const DIR = 'e2e/jf-live';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1480, height: 920 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const api = [];
page.on('response', async (r) => {
  try { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { let t = await r.text(); if (t.length > 9000) t = t.slice(0, 9000) + '…'; api.push({ url: r.url().replace('https://fkdemo.jingsoft.com', ''), status: r.status(), body: t }); } } catch {}
});
const snap = async (n) => { await page.screenshot({ path: `${DIR}/seller-${n}.png`, fullPage: true }).catch(() => {}); };
try {
  await page.goto('https://fkdemo.jingsoft.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  await page.getByText(/我的小店|登录|登 录/i).first().click().catch(() => {});
  await page.waitForTimeout(4000);
  await snap('login');
  await page.fill('input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="手机"]', '666666').catch(() => {});
  await page.fill('input[placeholder*="密码"]', '666666').catch(() => {});
  await page.getByRole('button', { name: /登.?录|提交/ }).first().click().catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(7000);
  await snap('after-login');
  // 进卖家中心/我的小店/控制台
  await page.getByText(/我的小店|卖家中心|商户中心|控制台|管理后台|进入店铺/i).first().click().catch(() => {});
  await page.waitForTimeout(6000);
  await snap('console');
  // 展开子菜单
  for (const sel of ['.el-sub-menu__title', '.el-submenu__title', '.arco-menu-inline-header', '.ant-menu-submenu-title']) {
    for (const s of await page.$$(sel)) { await s.click().catch(() => {}); await page.waitForTimeout(200); }
  }
  await page.waitForTimeout(1000);
  await snap('console-expanded');
  const center = await page.evaluate(() => {
    const set = new Set();
    ['aside', '.el-menu', '.sidebar', 'nav', '.menu', '[class*=menu]', '[class*=aside]'].forEach((s) => document.querySelectorAll(s).forEach((e) => set.add(e)));
    const menu = [...set].map((e) => (e.innerText || '').trim()).filter((t) => t.length > 2).sort((a, b) => b.length - a.length).slice(0, 3).join('\n==== panel ====\n');
    return { url: location.href, menu, body: document.body.innerText.slice(0, 4000) };
  });
  writeFileSync(`${DIR}/seller-center.txt`, `URL ${center.url}\n\nMENU:\n${center.menu}\n\nBODY:\n${center.body}`);
  console.log('seller: url', center.url, '| menu chars', center.menu.length, '| api', api.length);
} catch (e) { console.error('seller error:', e.message); }
finally {
  writeFileSync(`${DIR}/seller-api.json`, JSON.stringify(api, null, 2));
  console.log('seller api urls:\n' + [...new Set(api.map((a) => a.url.replace(/\?.*/, '')))].join('\n'));
  await b.close();
}
