/* 提现资金流 UI 端到端 + 账目核对:
   商户 UI 申请提现 → DB 验证(余额-A、冻结+A)→ 平台 UI 审批通过 → DB 验证(冻结-A、余额不变)。 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const URL = 'http://127.0.0.1:5173/console.html';
const A = 10; // 提现金额
const log = (...a) => console.log('[money]', ...a);
const fail = (m) => { console.error('[money] ❌', m); process.exit(1); };

const wallet = () => {
  const out = execSync(`mysql -uroot qfk -N -e "SELECT balance,frozen_balance FROM merchants WHERE id=1"`).toString().trim();
  const [b, f] = out.split(/\s+/).map(Number);
  return { balance: b, frozen: f };
};
const near = (a, b) => Math.abs(a - b) < 0.005;

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function loginGo(roleLabel, user, pass, nav) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('  pageerror:', e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByRole('radio', { name: roleLabel }).first().click();
  await page.locator('form input').nth(0).fill(user);
  await page.locator('form input').nth(1).fill(pass);
  await page.getByRole('button', { name: /^登录$/ }).first().click();
  await page.locator('aside nav button', { hasText: nav }).first().waitFor({ timeout: 12000 });
  await page.locator('aside nav button', { hasText: nav }).first().click();
  await page.waitForTimeout(1500);
  return { ctx, page };
}

try {
  const w0 = wallet();
  log(`初始:余额 ¥${w0.balance.toFixed(2)},冻结 ¥${w0.frozen.toFixed(2)}`);
  if (w0.balance < A) fail(`可用余额不足 ¥${A},无法测试`);

  // ===== 1) 商户 UI 申请提现 =====
  log('1) 商户申请提现 ¥' + A);
  const m = await loginGo('商户登录', 'demo_merchant', 'demo123456', '钱包 / 提现');
  await m.page.getByRole('button', { name: '申请提现' }).first().click();
  const dlg = m.page.locator('[role=dialog]');
  await dlg.waitFor({ timeout: 8000 });
  await dlg.locator('input').nth(0).fill(String(A));
  await dlg.locator('input, textarea').nth(1).fill('支付宝 e2e@demo.com');
  await dlg.getByRole('button', { name: /确认|提交|申请提现/ }).first().click();
  await m.page.waitForTimeout(2500);
  await m.ctx.close();

  const w1 = wallet();
  log(`   申请后:余额 ¥${w1.balance.toFixed(2)},冻结 ¥${w1.frozen.toFixed(2)}`);
  if (!near(w1.balance, w0.balance - A) || !near(w1.frozen, w0.frozen + A))
    fail(`申请账目不符:期望 余额 ${(w0.balance - A).toFixed(2)} / 冻结 ${(w0.frozen + A).toFixed(2)}`);
  log('   ✓ 申请账目正确(余额−A,冻结+A)');

  // ===== 2) 平台 UI 审批通过 =====
  log('2) 平台审批通过打款');
  const a = await loginGo('平台登录', 'admin', 'admin123', '提现审核');
  // 找到待审核行的「通过打款」按钮(精确,避免误匹配「已通过」筛选 tab)
  const approveBtn = a.page.getByRole('button', { name: '通过打款', exact: true }).first();
  await approveBtn.waitFor({ timeout: 8000 });
  await approveBtn.click();
  await a.page.waitForTimeout(2500);
  await a.ctx.close();

  const w2 = wallet();
  log(`   审批后:余额 ¥${w2.balance.toFixed(2)},冻结 ¥${w2.frozen.toFixed(2)}`);
  if (!near(w2.frozen, w1.frozen - A) || !near(w2.balance, w1.balance))
    fail(`审批账目不符:期望 冻结 ${(w1.frozen - A).toFixed(2)} / 余额不变 ${w1.balance.toFixed(2)}`);
  log('   ✓ 审批账目正确(冻结−A 打款,余额不变)');

  log(`✅ 提现资金流验证通过:余额 ${w0.balance.toFixed(2)}→${w2.balance.toFixed(2)},冻结全程守恒`);
} catch (e) {
  console.error('[money] 异常:', e.message);
  process.exit(1);
} finally {
  await browser.close().catch(() => {});
}
