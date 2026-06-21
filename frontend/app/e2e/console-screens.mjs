/* 逐屏验证:登录后点开每个后台页面,真渲染+真后端,捕获崩溃(pageerror)与数据错误。 */
import { chromium } from 'playwright-core';

const URL = 'http://127.0.0.1:5173/console.html';
const log = (...a) => console.log('[screens]', ...a);
const browser = await chromium.launch({ channel: 'chrome', headless: true });

const MERCHANT = ['数据概览', '商品管理', '店铺装修', '分类管理', '卡密管理', '订单管理', '钱包 / 提现'];
const ADMIN = ['仪表盘', '商户审核', '支付渠道', '提现审核', '对账报表', '内容管理', '邀请码', '订单(跨商户)', '商品(跨商户)', '平台配置', '异常日志'];

async function walk(roleLabel, user, pass, navs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  let pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  const results = [];
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.getByRole('radio', { name: roleLabel }).first().click();
    await page.locator('form input').nth(0).fill(user);
    await page.locator('form input').nth(1).fill(pass);
    await page.getByRole('button', { name: /^登录$/ }).first().click();
    await page.locator('aside nav button').first().waitFor({ timeout: 12000 });

    for (const nav of navs) {
      pageErrors = [];
      await page.locator('aside nav button', { hasText: nav }).first().click();
      await page.waitForTimeout(1800); // 等 useAsync 异步结算
      const root = await page.locator('main').innerText().catch(() => '');
      const placeholder = root.includes('建设中');
      const errBar = /加载失败|请求失败|未找到|网络连接失败/.test(root);
      const crashed = pageErrors.length > 0;
      results.push({ nav, ok: !placeholder && !crashed, placeholder, errBar, crash: pageErrors.slice(0, 2) });
    }
    await page.screenshot({ path: `e2e/console-${roleLabel === '商户登录' ? 'merchant' : 'admin'}.png`, fullPage: true });
  } catch (e) {
    log(`${roleLabel} 流程异常:`, e.message);
  } finally {
    await ctx.close();
  }
  return results;
}

let allOk = true;
for (const [label, u, p, navs] of [['商户登录', 'demo_merchant', 'demo123456', MERCHANT], ['平台登录', 'admin', 'admin123', ADMIN]]) {
  log(`==== ${label} ====`);
  const rs = await walk(label, u, p, navs);
  for (const r of rs) {
    const tag = r.crash.length ? '❌崩溃' : r.placeholder ? '❌未接入' : r.errBar ? '⚠数据错误' : '✅';
    log(`  ${tag} ${r.nav}${r.crash.length ? ' :: ' + r.crash.join(' | ') : ''}`);
    if (r.crash.length || r.placeholder) allOk = false;
  }
}
await browser.close();
log(allOk ? '✅ 全部页面渲染通过(无崩溃/无未接入)' : '❌ 有页面崩溃或未接入,见上');
process.exit(allOk ? 0 : 1);
