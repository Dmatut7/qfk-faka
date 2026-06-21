/* 验证「取卡/查单」手动查询路径 + 商品名修复(用已发货订单 0005)。 */
import { chromium } from 'playwright-core';

const APP = 'http://127.0.0.1:5173/';
const ORDER_NO = process.argv[2] || '202606212126458766520500000';
const EMAIL = process.argv[3] || 'e2e@demo.com';
const log = (...a) => console.log('[lookup]', ...a);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newContext({ viewport: { width: 420, height: 880 } }).then((c) => c.newPage());
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERR: ' + e.message));

try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('演示商品').first().waitFor({ timeout: 15000 });

  log('1) 点 取卡/查单');
  await page.getByRole('button', { name: /取卡|查单/ }).first().click();
  await page.getByRole('button', { name: /查询订单/ }).first().waitFor({ timeout: 10000 });

  log('2) 填订单号 + 邮箱');
  const inputs = page.locator('form input');
  await inputs.nth(0).fill(ORDER_NO);
  await inputs.nth(1).fill(EMAIL);

  log('3) 查询');
  await page.getByRole('button', { name: /查询订单/ }).first().click();

  log('4) 断言:卡密 + 真实商品名(非「商品 #」)');
  await page.getByText(/DEMO-CARD-/).first().waitFor({ timeout: 15000 });
  const card = (await page.getByText(/DEMO-CARD-/).first().textContent()).trim();
  log('   ✓ 卡密:', card);

  const body = await page.locator('#root').innerText();
  const hasRealName = body.includes('演示商品');
  const hasPlaceholder = /商品 #\d/.test(body);
  log('   商品名显示真实名「演示商品」:', hasRealName, '| 仍是占位「商品 #id」:', hasPlaceholder);

  await page.screenshot({ path: 'e2e/lookup-result.png', fullPage: true });
  if (errs.length) { log('⚠ JS 错误:'); errs.forEach((e) => log('   -', e)); }
  if (!hasRealName || hasPlaceholder) { console.error('[lookup] ❌ 商品名仍是占位'); process.exit(2); }
  log('✅ 查单路径 + 商品名修复 通过');
} catch (e) {
  await page.screenshot({ path: 'e2e/lookup-error.png', fullPage: true }).catch(() => {});
  console.error('[lookup] 异常:', e.message);
  errs.forEach((x) => console.error('   -', x));
  process.exit(1);
} finally {
  await browser.close().catch(() => {});
}
