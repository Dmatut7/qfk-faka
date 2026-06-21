import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
async function shot(role, user, pass, nav, file) {
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:5173/console.html', { waitUntil: 'domcontentloaded' });
  await p.getByRole('radio', { name: role }).first().click();
  await p.locator('form input').nth(0).fill(user);
  await p.locator('form input').nth(1).fill(pass);
  await p.getByRole('button', { name: /^登录$/ }).first().click();
  await p.locator('aside nav button', { hasText: nav }).first().waitFor({ timeout: 12000 });
  await p.locator('aside nav button', { hasText: nav }).first().click();
  await p.waitForTimeout(1800);
  await p.screenshot({ path: file });
  console.log(file, 'ok');
}
await shot('商户登录', 'demo_merchant', 'demo123456', '店铺装修', 'e2e/shot-m-shop.png');
await shot('平台登录', 'admin', 'admin123', '内容管理', 'e2e/shot-a-content.png');
await b.close();
