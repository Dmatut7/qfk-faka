import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await b.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const apis = [];
page.on('response', async r => { const ct=r.headers()['content-type']||''; if(ct.includes('json')){try{apis.push({u:r.url().replace(/^https?:\/\/[^/]+/,''),d:await r.json()});}catch{}} });
// 试卖家后台常见入口
for (const url of ['https://fkdemo.jingsoft.com/user', 'https://fkdemo.jingsoft.com/seller', 'https://fkdemo.jingsoft.com/admin/']) {
  // 跳过,先走前台登录
}
await page.goto('https://fkdemo.jingsoft.com/login', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>page.goto('https://fkdemo.jingsoft.com/', {waitUntil:'networkidle',timeout:60000}).catch(e=>console.log('goto',e.message)));
await page.waitForTimeout(3500);
console.log('登录页 url:', page.url());
// 填登录
await page.locator('input:not([type=password]):not([type=hidden])').first().fill('666666').catch(e=>console.log('user fill',e.message));
await page.locator('input[type=password]').first().fill('666666').catch(e=>console.log('pwd fill',e.message));
const btn = page.getByRole('button', { name: /登\s*录|登入|进入|login/i }).first();
if (await btn.count()) await btn.click().catch(()=>{}); else await page.keyboard.press('Enter');
let txt='';
for (let i=0;i<25;i++){ await page.waitForTimeout(1000); txt=await page.locator('body').innerText().catch(()=>''); if(/卖家|商户|店铺|商品|订单|余额|工作台|控制台/.test(txt)) break; }
await page.waitForTimeout(2500);
console.log('登录后 url:', page.url());
console.log('=== 登录后页面文本 ===\n'+txt.slice(0,2200));
await page.screenshot({ path: 'e2e/jf-seller-home.png' });
console.log('\n=== API 端点 ===\n'+[...new Set(apis.map(a=>a.u.split('?')[0]))].slice(-25).join('\n'));
await b.close();
