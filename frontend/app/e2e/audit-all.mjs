/* 全量视觉审查截图:买家关键态 + 商户后台全 10 屏 + 平台后台全 18 屏。
   输出 e2e/audit/*.png。依赖 dev 5173 + 后端 8765 + demo 种子。 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const APP = 'http://127.0.0.1:5173';
const OUT = new URL('./audit/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[audit]', ...a);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const done = [];
async function ctx(w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  return c;
}
const settle = (p, ms = 1200) => p.waitForTimeout(ms);
async function shot(p, name) { try { await p.screenshot({ path: OUT + name + '.png', fullPage: true }); done.push(name); log('✓', name); } catch (e) { log('✗ shot', name, e.message); } }

const MERCHANT_NAV = ['数据概览', '商品管理', '分类管理', '卡密管理', '订单管理', '投诉处理', '优惠券', '满减满折', '钱包 / 提现', '店铺装修'];
const ADMIN_NAV = ['仪表盘', '大屏数据', '商户审核', '邀请码', '订单(跨商户)', '商品(跨商户)', '投诉仲裁', '买家黑名单', '风控记录', '提现审核', '对账报表', '内容管理', '禁售目录', '支付渠道', '平台配置', '操作日志', '异常日志', '任务计划'];

async function consoleAudit(prefix, role, user, pass, navs) {
  const c = await ctx(1440, 1000); const p = await c.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(APP + '/console.html', { waitUntil: 'domcontentloaded' }); await settle(p, 900);
  if (role === 'admin') { try { await p.getByText('平台登录').click({ timeout: 3000 }); await settle(p, 300); } catch {} }
  const inputs = p.locator('input');
  await inputs.nth(0).fill(user); await inputs.nth(1).fill(pass);
  await p.getByRole('button', { name: /登录/ }).first().click();
  await settle(p, 1800);
  for (let i = 0; i < navs.length; i++) {
    const label = navs[i];
    try {
      await p.getByRole('button', { name: label }).first().click({ timeout: 4000 });
      await settle(p, 1300);
      await shot(p, `${prefix}-${String(i).padStart(2, '0')}-${label.replace(/[\s/()]/g, '')}`);
    } catch (e) { log('✗ nav', prefix, label, e.message); }
  }
  log(`${prefix} 运行时错误:`, errs.length ? [...new Set(errs)] : '无');
  await c.close();
}

try {
  // 买家关键态(桌面)
  let c = await ctx(1366, 950); let p = await c.newPage();
  const berr = []; p.on('pageerror', (e) => berr.push(String(e)));
  await p.goto(APP + '/', { waitUntil: 'domcontentloaded' }); await settle(p, 2600);
  await shot(p, 'buyer-00-home');
  try { await p.locator('.mk-pc').first().click(); await settle(p, 1500); await shot(p, 'buyer-01-detail'); } catch (e) { log('detail', e.message); }
  await c.close();
  log('买家运行时错误:', berr.length ? [...new Set(berr)] : '无');

  // 全后台
  await consoleAudit('merchant', 'merchant', 'demo_merchant', 'demo123456', MERCHANT_NAV);
  await consoleAudit('admin', 'admin', 'admin', 'admin123', ADMIN_NAV);
} finally {
  await browser.close();
  log('完成,共', done.length, '张');
}
