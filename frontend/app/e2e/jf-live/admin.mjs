/* 抓鲸发卡真实总后台:登录 admin/jingsoft → 展开菜单 + 截图 + 捕获 adminApi 数据模型 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const DIR = 'e2e/jf-live';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1480, height: 920 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const api = [];
page.on('response', async (r) => {
  try { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { let t = await r.text(); if (t.length > 3500) t = t.slice(0, 3500) + '…'; api.push({ url: r.url(), status: r.status(), body: t }); } } catch {}
});
try {
  await page.goto('https://fkdemo.jingsoft.com/admin', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('input', { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.fill('input[placeholder*="用户名"]', 'admin').catch(() => {});
  await page.fill('input[placeholder*="密码"]', 'jingsoft').catch(() => {});
  await page.screenshot({ path: `${DIR}/admin-login-filled.png` }).catch(() => {});
  await page.getByRole('button', { name: /登.?录/ }).first().click().catch(() => {});
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${DIR}/admin-dashboard.png` }).catch(() => {});
  // 展开所有可折叠子菜单(Element/Arco/Ant)
  for (const sel of ['.el-sub-menu__title', '.el-submenu__title', '.arco-menu-inline-header', '.ant-menu-submenu-title']) {
    const subs = await page.$$(sel);
    for (const s of subs) { await s.click().catch(() => {}); await page.waitForTimeout(250); }
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}/admin-menu-expanded.png`, fullPage: true }).catch(() => {});
  const menu = await page.evaluate(() => {
    const set = new Set();
    ['aside', '.el-menu', '.sidebar', '.layout-aside', '.menu', 'nav', '[class*=aside]', '[class*=sidebar]'].forEach((s) => document.querySelectorAll(s).forEach((e) => set.add(e)));
    return [...set].map((e) => (e.innerText || '').trim()).filter((t) => t.length > 2).sort((a, b) => b.length - a.length).slice(0, 3).join('\n==== panel ====\n');
  });
  const meta = await page.evaluate(() => ({ title: document.title, url: location.href }));
  writeFileSync(`${DIR}/admin-menu.txt`, `TITLE ${meta.title}\nURL ${meta.url}\n\n${menu}`);
  console.log('admin: url', meta.url, '| menu chars', menu.length);
} catch (e) { console.error('admin error:', e.message); }
finally {
  writeFileSync(`${DIR}/admin-api.json`, JSON.stringify(api, null, 2));
  console.log('admin api', api.length, 'urls:\n' + [...new Set(api.map((a) => a.url.replace(/\?.*/, '').replace('https://fkdemo.jingsoft.com', '')))].join('\n'));
  await b.close();
}
