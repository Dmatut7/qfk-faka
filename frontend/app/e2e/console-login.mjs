/* A0 验证:控制台真登录(商户 + 平台),真后端。 */
import { chromium } from 'playwright-core';

const URL = 'http://127.0.0.1:5173/console.html';
const log = (...a) => console.log('[console-login]', ...a);
const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function loginAs(roleLabel, user, pass, navText) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.getByRole('radio', { name: roleLabel }).first().click();
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(user);
    await inputs.nth(1).fill(pass);
    await page.getByRole('button', { name: /^登录$/ }).first().click();
    // 登录成功 → 侧栏出现该角色的导航项
    await page.getByText(navText).first().waitFor({ timeout: 12000 });
    log(`✓ ${roleLabel} 登录成功(侧栏出现「${navText}」)`);
    if (errs.length) { log('  ⚠ JS 错误:', errs.join(' | ')); return false; }
    return true;
  } catch (e) {
    await page.screenshot({ path: `e2e/console-${roleLabel}-error.png` }).catch(() => {});
    log(`✗ ${roleLabel} 失败: ${e.message}`);
    if (errs.length) log('  JS 错误:', errs.join(' | '));
    return false;
  } finally {
    await ctx.close();
  }
}

let ok = true;
ok = (await loginAs('商户登录', 'demo_merchant', 'demo123456', '商品管理')) && ok;
ok = (await loginAs('平台登录', 'admin', 'admin123', '商户审核')) && ok;
// 错误密码应被拒
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.getByRole('radio', { name: '商户登录' }).first().click();
await page.locator('form input').nth(0).fill('demo_merchant');
await page.locator('form input').nth(1).fill('wrong-pass');
await page.getByRole('button', { name: /^登录$/ }).first().click();
const rejected = await page.getByText(/账号或密码错误|登录失败|错误/).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
log(rejected ? '✓ 错误密码被拒' : '✗ 错误密码未被拒');
ok = rejected && ok;
await ctx.close();

await browser.close();
log(ok ? '✅ A0 控制台登录验证通过' : '❌ A0 验证有失败');
process.exit(ok ? 0 : 1);
