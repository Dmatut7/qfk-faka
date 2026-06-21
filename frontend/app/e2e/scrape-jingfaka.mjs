/* 用无头 Chrome 渲染鲸发卡演示站,抓 DOM 文本 + 截图 + 截获 JSON API(看其功能与数据模型)。 */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

const apis = [];
page.on('response', async (r) => {
  const u = r.url();
  const ct = (r.headers()['content-type'] || '');
  if (ct.includes('json') && !u.includes('.js')) {
    try { const j = await r.json(); apis.push({ url: u.replace(/^https?:\/\/[^/]+/, ''), data: j }); } catch { /* */ }
  }
});

const pages = [
  ['shop', 'https://fkdemo.jingsoft.com/shop/bbb'],
  ['home', 'https://fkdemo.jingsoft.com/'],
];

for (const [name, url] of pages) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 50000 });
  } catch (e) {
    console.log(`[${name}] goto: ${e.message}`);
  }
  await page.waitForTimeout(3500);
  const text = await page.locator('body').innerText().catch(() => '(no text)');
  console.log(`\n========== [${name}] ${url} — innerText ==========`);
  console.log(text.slice(0, 3500));
  await page.screenshot({ path: `e2e/jf-${name}.png`, fullPage: true }).catch(() => {});
  console.log(`[${name}] screenshot → e2e/jf-${name}.png`);
}

console.log('\n========== 截获的 JSON API(数据模型)==========');
for (const a of apis.slice(0, 20)) {
  console.log('\n→', a.url);
  console.log(JSON.stringify(a.data).slice(0, 800));
}

await browser.close();
