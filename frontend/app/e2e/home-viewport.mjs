import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2600);
await p.screenshot({ path: 'e2e/mobile/vp-card.png' }); // 视口态 卡密
for (const t of ['资源','知识']) {
  try { await p.getByText(t, { exact: true }).first().click({ timeout: 2500 }); await p.waitForTimeout(800);
    await p.screenshot({ path: `e2e/mobile/vp-${t}.png` }); } catch(e){ console.log(t, e.message); }
}
console.log('done');
await b.close();
