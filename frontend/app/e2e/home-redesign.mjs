import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2600);
await p.screenshot({ path: 'e2e/mobile/redesign-01-card-grid.png', fullPage: true });
// 切到知识/资源 tab 看列表布局
for (const t of ['知识', '资源', '权益']) {
  try { await p.getByText(t, { exact: true }).first().click({ timeout: 2500 }); await p.waitForTimeout(900);
    await p.screenshot({ path: `e2e/mobile/redesign-${t}.png`, fullPage: true }); console.log('截', t); } catch(e){ console.log(t, 'skip', e.message); }
}
console.log('错误:', errs.length ? [...new Set(errs)] : '无');
await b.close();
