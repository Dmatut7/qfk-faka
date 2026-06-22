import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1366, height: 900 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2600);
await p.screenshot({ path: 'e2e/mobile/dt-card.png', fullPage: true });
try { await p.getByText('资源', { exact: true }).first().click({ timeout: 2500 }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'e2e/mobile/dt-资源.png', fullPage: true }); } catch(e){ console.log(e.message); }
console.log('done');
await b.close();
