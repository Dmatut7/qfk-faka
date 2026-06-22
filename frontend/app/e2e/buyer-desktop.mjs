import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1366, height: 900 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
const s=(ms=900)=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' }); await s(2600);
// 详情
try { await p.locator('.mk-pc').first().click(); await s(1300); await p.screenshot({path:'e2e/mobile/dt-detail.png',fullPage:true}); } catch(e){console.log('detail',e.message);}
// 取卡
try { await p.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'}); await s(1500); await p.getByText(/取卡|查单/).first().click(); await s(1000); await p.screenshot({path:'e2e/mobile/dt-lookup.png',fullPage:true}); } catch(e){console.log('lookup',e.message);}
// 门户
try { await p.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'}); await s(1200); await p.getByText(/平台|门户/).first().click(); await s(1000); await p.screenshot({path:'e2e/mobile/dt-portal.png',fullPage:true}); } catch(e){console.log('portal',e.message);}
console.log('done');
await b.close();
