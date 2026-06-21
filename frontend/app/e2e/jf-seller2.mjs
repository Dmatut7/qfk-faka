import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await b.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
await page.goto('https://fkdemo.jingsoft.com/', { waitUntil: 'networkidle', timeout: 60000 }).catch(e=>console.log('goto',e.message));
await page.waitForTimeout(3000);
// 点「商家中心」或「登录/开通小店」
for (const t of ['商家中心','登录','开通小店','卖家中心']) {
  const el = page.getByText(t, { exact: false }).first();
  if (await el.count()) { await el.click({timeout:3000}).catch(()=>{}); console.log('点了:', t); await page.waitForTimeout(3500); break; }
}
console.log('当前 url:', page.url());
// 若出现登录表单则登录
const u = page.locator('input:not([type=password]):not([type=hidden])').first();
if (await u.count()) {
  await u.fill('666666').catch(()=>{});
  await page.locator('input[type=password]').first().fill('666666').catch(()=>{});
  const btn = page.getByRole('button', { name: /登\s*录|登入|进入|login/i }).first();
  if (await btn.count()) await btn.click().catch(()=>{}); else await page.keyboard.press('Enter');
  let txt='';
  for (let i=0;i<25;i++){ await page.waitForTimeout(1000); txt=await page.locator('body').innerText().catch(()=>''); if(/商品管理|订单管理|余额|店铺|工作台|卡密|发货|装修|概况/.test(txt)) break; }
  await page.waitForTimeout(2500);
  console.log('卖家后台 url:', page.url());
  console.log('=== 卖家后台文本 ===\n'+txt.slice(0,2200));
  await page.screenshot({ path: 'e2e/jf-seller-backend.png' });
} else { console.log('未出现登录表单;当前页文本:\n'+(await page.locator('body').innerText().catch(()=>'')).slice(0,800)); await page.screenshot({ path: 'e2e/jf-seller-backend.png' }); }
await b.close();
