import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage(); const s=(ms=900)=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:5173/console.html',{waitUntil:'domcontentloaded'}); await s(900);
await p.getByText('平台登录').click(); await s(300);
const ins=p.locator('input'); await ins.nth(0).fill('admin'); await ins.nth(1).fill('admin123');
await p.getByRole('button',{name:/登录/}).first().click(); await s(1800);
// 开抽屉点 订单(跨商户)
try { await p.getByRole('button',{name:/打开菜单/}).click(); await s(500); await p.getByRole('button',{name:/订单\(跨商户\)/}).first().click(); await s(1200);
  await p.screenshot({path:'e2e/mobile/m-admin-orders.png',fullPage:true}); console.log('截 admin订单'); } catch(e){console.log('skip',e.message);}
await b.close();
