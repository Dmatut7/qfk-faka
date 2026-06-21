/* 登进鲸发卡 admin 后台(admin/jingsoft)抓菜单(功能树)+ API + 截图。
   再试前台卖家账号(666666/666666)看商户/卖家中心。 */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function login(url, user, pass, name) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const apis = [];
  page.on('response', async (r) => {
    const u = r.url(); const ct = r.headers()['content-type'] || '';
    if (ct.includes('json')) { try { const j = await r.json(); apis.push({ u: u.replace(/^https?:\/\/[^/]+/, ''), d: j }); } catch { /* */ } }
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 50000 });
  } catch (e) { console.log(`[${name}] goto: ${e.message}`); }
  await page.waitForTimeout(2500);
  // 填登录
  try {
    const userBox = page.locator('input:not([type="password"]):not([type="hidden"]):not([type="checkbox"])').first();
    await userBox.fill(user, { timeout: 6000 });
    await page.locator('input[type="password"]').first().fill(pass, { timeout: 6000 });
    // 点登录按钮(多种文案)或回车
    const btn = page.getByRole('button', { name: /登\s*录|登入|login|进入/i }).first();
    if (await btn.count()) await btn.click({ timeout: 4000 }).catch(() => {});
    else await page.keyboard.press('Enter');
  } catch (e) { console.log(`[${name}] login fill: ${e.message}`); }
  await page.waitForTimeout(4500);

  const text = await page.locator('body').innerText().catch(() => '');
  console.log(`\n========== [${name}] 登录后 innerText(菜单/功能树)==========`);
  console.log(text.slice(0, 4000));
  await page.screenshot({ path: `e2e/jf-${name}.png`, fullPage: false }).catch(() => {});

  console.log(`\n========== [${name}] 关键 API(菜单/权限/配置/数据模型)==========`);
  for (const a of apis) {
    if (/menu|nav|rule|auth|node|index|config|info|user|account|dashboard|count|stat/i.test(a.u)) {
      console.log(`\n→ ${a.u}`);
      console.log(JSON.stringify(a.d).slice(0, 1500));
    }
  }
  await ctx.close();
}

await login('https://fkdemo.jingsoft.com/admin', 'admin', 'jingsoft', 'admin');
await login('https://fkdemo.jingsoft.com/', '666666', '666666', 'seller');

await browser.close();
