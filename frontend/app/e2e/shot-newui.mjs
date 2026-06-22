/* 新橙色 UI 落地视觉验收:截买家四端 + 商户/平台后台关键屏。
   依赖:dev server 5173(proxy→8765),后端 demo 种子。输出 e2e/newui/*.png */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const APP = 'http://127.0.0.1:5173';
const OUT = new URL('./newui/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[shot]', ...a);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const shots = [];
async function shot(page, name) { await page.screenshot({ path: OUT + name + '.png', fullPage: true }); shots.push(name); log('✓', name); }
async function ctx(w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  // 屏蔽 Google Fonts:无头环境拉取慢会让 screenshot 卡在 fonts.ready
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  return c;
}
const settle = (page, ms = 1400) => page.waitForTimeout(ms);

try {
  /* ---------- 买家前台 ---------- */
  // 首页 移动
  let c = await ctx(420, 900); let page = await c.newPage();
  const perr = [];
  page.on('pageerror', (e) => perr.push(String(e)));
  await page.goto(APP + '/', { waitUntil: 'domcontentloaded' }); await settle(page, 2600);
  const cards = await page.locator('.mk-pc').count();
  log('首页商品卡数量:', cards);
  await shot(page, 'buyer-home-mobile');
  // 详情 移动(点第一个商品卡)
  try {
    if (cards > 0) { await page.locator('.mk-pc').first().click(); await settle(page); await shot(page, 'buyer-detail-mobile'); await page.goBack?.(); }
  } catch (e) { log('详情 skip:', e.message); }
  await c.close();

  // 首页 桌面
  c = await ctx(1366, 900); page = await c.newPage();
  await page.goto(APP + '/', { waitUntil: 'domcontentloaded' }); await settle(page, 2600);
  await shot(page, 'buyer-home-desktop');
  // 取卡/查单
  try { await page.getByText(/取卡|查单/).first().click({ timeout: 3000 }); await settle(page); await shot(page, 'buyer-lookup-desktop'); } catch (e) { log('lookup skip:', e.message); }
  // 门户(TopBar 平台入口)
  try { await page.goto(APP + '/', { waitUntil: 'domcontentloaded' }); await settle(page, 800); await page.getByText(/平台|门户/).first().click({ timeout: 3000 }); await settle(page); await shot(page, 'portal-desktop'); } catch (e) { log('portal skip:', e.message); }
  log('买家页错误:', perr.length ? perr : '无');
  await c.close();

  /* ---------- 后台(登录) ---------- */
  async function consoleLogin(role, user, pass) {
    const cc = await ctx(1440, 960); const pg = await cc.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(APP + '/console.html', { waitUntil: 'domcontentloaded' }); await settle(pg, 900);
    if (role === 'admin') { try { await pg.getByText('平台登录').click({ timeout: 3000 }); await settle(pg, 400); } catch {} }
    const inputs = pg.locator('input');
    await inputs.nth(0).fill(user);
    await inputs.nth(1).fill(pass);
    await pg.getByRole('button', { name: /登录/ }).first().click();
    await settle(pg, 1800);
    log(role + ' 登录后错误:', errs.length ? errs : '无');
    return { cc, pg };
  }
  // 商户后台
  try {
    const { cc, pg } = await consoleLogin('merchant', 'demo_merchant', 'demo123456');
    await shot(pg, 'console-merchant-dashboard');
    await cc.close();
  } catch (e) { log('merchant skip:', e.message); }
  // 平台后台 + 大屏
  try {
    const { cc, pg } = await consoleLogin('admin', 'admin', 'admin123');
    await shot(pg, 'console-admin-dashboard');
    try { await pg.getByText('大屏数据').first().click({ timeout: 3000 }); await settle(pg, 1500); await shot(pg, 'console-admin-bigscreen'); } catch (e) { log('bigscreen skip:', e.message); }
    await cc.close();
  } catch (e) { log('admin skip:', e.message); }
} finally {
  await browser.close();
  log('完成,共', shots.length, '张:', shots.join(', '));
}
