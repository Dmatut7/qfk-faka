/* 抓鲸发卡前台 + 登录 666666(查明会员中心/卖家中心),截图 + 菜单 + API */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const DIR = 'e2e/jf-live';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const api = [];
page.on('response', async (r) => {
  try { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { let t = await r.text(); if (t.length > 3000) t = t.slice(0, 3000) + '…'; api.push({ url: r.url(), status: r.status(), body: t }); } } catch {}
});
try {
  await page.goto('https://fkdemo.jingsoft.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  const home = await page.evaluate(() => ({ url: location.href, title: document.title, text: document.body.innerText.slice(0, 5000) }));
  writeFileSync(`${DIR}/front-home.txt`, `URL ${home.url}\nTITLE ${home.title}\n\n${home.text}`);
  // 找登录入口(顶部「登录/我的小店」)
  await page.getByText(/登录|登 录|我的小店|会员|卖家/i).first().click().catch(() => {});
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${DIR}/front-login.png` }).catch(() => {});
  await page.fill('input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="手机"]', '666666').catch(() => {});
  await page.fill('input[placeholder*="密码"]', '666666').catch(() => {});
  await page.getByRole('button', { name: /登.?录|提交/ }).first().click().catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${DIR}/front-after-login.png`, fullPage: true }).catch(() => {});
  const center = await page.evaluate(() => {
    const set = new Set();
    ['aside', '.el-menu', '.sidebar', 'nav', '.menu', '.user-center', '.member', '[class*=menu]', '[class*=aside]'].forEach((s) => document.querySelectorAll(s).forEach((e) => set.add(e)));
    const menu = [...set].map((e) => (e.innerText || '').trim()).filter((t) => t.length > 2).sort((a, b) => b.length - a.length).slice(0, 3).join('\n==== panel ====\n');
    return { url: location.href, menu, body: document.body.innerText.slice(0, 4000) };
  });
  writeFileSync(`${DIR}/front-center.txt`, `URL ${center.url}\n\nMENU:\n${center.menu}\n\nBODY:\n${center.body}`);
  console.log('front: url after login', center.url, '| menu chars', center.menu.length, '| api', api.length);
} catch (e) { console.error('front error:', e.message); }
finally {
  writeFileSync(`${DIR}/front-api.json`, JSON.stringify(api, null, 2));
  console.log('front api urls:\n' + [...new Set(api.map((a) => a.url.replace(/\?.*/, '').replace('https://fkdemo.jingsoft.com', '')))].join('\n'));
  await b.close();
}
