import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await b.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
await page.goto('https://fkdemo.jingsoft.com/admin', { waitUntil: 'networkidle', timeout: 60000 }).catch(e=>console.log('goto',e.message));
await page.waitForTimeout(3000);
await page.locator('input:not([type=password]):not([type=hidden])').first().fill('admin').catch(()=>{});
await page.locator('input[type=password]').first().fill('jingsoft').catch(()=>{});
const btn = page.getByRole('button', { name: /登\s*录|login/i }).first();
if (await btn.count()) await btn.click().catch(()=>{}); else await page.keyboard.press('Enter');
// 轮询直到后台渲染(菜单出现)
let txt = '';
for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); txt = await page.locator('body').innerText().catch(()=>''); if (/仪表盘|订单|商户|工作台|概况/.test(txt)) break; }
await page.waitForTimeout(2500);
await page.screenshot({ path: 'e2e/jf-admin-dashboard.png' });
console.log('=== ADMIN 后台页面文本(菜单+仪表盘)===');
console.log(txt.slice(0, 2500));
// 尝试进订单/商户/提现页
for (const t of ['订单', '商户', '提现', '内容']) {
  try { await page.getByText(t, { exact: false }).first().click({ timeout: 3500 }); await page.waitForTimeout(2800); await page.screenshot({ path: `e2e/jf-admin-${t}.png` }); console.log('\n['+t+'] 截图 ok, url:', page.url().slice(-30)); } catch (e) { console.log('\n['+t+'] fail'); }
}
await b.close();
