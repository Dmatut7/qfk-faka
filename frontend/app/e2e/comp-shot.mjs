import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 414, height: 1400 } });
const p = await c.newPage();
try {
  await p.goto('https://fkdemo.jingsoft.com/shop/bbb', { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: 'e2e/competitor.png', fullPage: true });
  const txt = (await p.locator('body').innerText().catch(()=> '')).slice(0, 400);
  console.log('加载成功,正文片段:', txt.replace(/\n+/g,' | '));
} catch (e) { console.log('加载失败:', e.message.split('\n')[0]); }
await b.close();
