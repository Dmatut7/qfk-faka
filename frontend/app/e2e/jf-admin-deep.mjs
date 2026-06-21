import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();
const apis = [];
page.on('response', async r => { const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { try { apis.push({ u: r.url().replace(/^https?:\/\/[^/]+/, ''), d: await r.json() }); } catch {} } });
// 登录
await page.goto('https://fkdemo.jingsoft.com/admin', { waitUntil: 'domcontentloaded', timeout: 50000 }).catch(e=>console.log('goto',e.message));
await page.waitForTimeout(3000);
await page.locator('input:not([type=password]):not([type=hidden])').first().fill('admin').catch(()=>{});
await page.locator('input[type=password]').first().fill('jingsoft').catch(()=>{});
const btn = page.getByRole('button', { name: /登\s*录|login/i }).first();
if (await btn.count()) await btn.click().catch(()=>{}); else await page.keyboard.press('Enter');
await page.waitForTimeout(5500);
console.log('登录后 URL:', page.url());
await page.screenshot({ path: 'e2e/jf-admin-dashboard.png' });
console.log('仪表盘截图 ok');
// 逐个点侧栏菜单(先展开父级再点子项),截图
const items = ['商户审核','订单列表','提现管理','内容管理','邀请码','进件审核','主题模板','基础信息'];
for (const t of items) {
  try {
    const before = apis.length;
    // 尝试直接点;若在折叠父级下,先点可能的父级文字
    const el = page.getByText(t, { exact: true }).first();
    if (await el.count()) { await el.click({ timeout: 4000 }); await page.waitForTimeout(2500); await page.screenshot({ path: `e2e/jf-admin-${t}.png` }); console.log(t, 'ok | url=', page.url().slice(-40), '| 新API:', apis.slice(before).map(a=>a.u.split('?')[0]).filter(u=>/admin/i.test(u)).slice(0,3).join(',')); }
    else console.log(t, '未找到菜单项');
  } catch (e) { console.log(t, 'fail:', e.message.slice(0,50)); }
}
await b.close();
