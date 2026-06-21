/* 端到端:无头 Chrome 渲染真实前端 → 走完整买家流程 → 触发签名回调模拟支付 → 断言卡密出现。
   依赖:dev server(5173,proxy→后端 8765)在跑;后端种子数据 demo 店铺/商品/卡密。 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const APP = 'http://127.0.0.1:5173/';
const BACKEND = 'http://127.0.0.1:8765';
const log = (...a) => console.log('[e2e]', ...a);
const fail = (m) => { console.error('[e2e] ❌ FAIL:', m); process.exit(1); };

// 用后端渠道密钥构造验签正确的 epay 回调并发送(模拟网关付款成功)
function fireCallback(paymentNo) {
  const php = `PAYNO='${paymentNo}' php -r '` +
    `$key="demo_epay_key";` +
    `$p=["pid"=>"1000","out_trade_no"=>getenv("PAYNO"),"trade_no"=>"E2E".substr(md5(getenv("PAYNO")),0,10),"money"=>"9.90","trade_status"=>"TRADE_SUCCESS","type"=>"alipay","name"=>"order"];` +
    `$s=array_filter($p,fn($v)=>is_scalar($v)&&$v!=="");ksort($s);` +
    `$parts=[];foreach($s as $k=>$v)$parts[]="$k=$v";$p["sign"]=md5(implode("&",$parts).$key);$p["sign_type"]="MD5";` +
    `echo http_build_query($p);'`;
  const query = execSync(php).toString().trim();
  const ack = execSync(`curl -s "${BACKEND}/pay/notify/epay?${query}"`).toString().trim();
  return ack;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 420, height: 880 } });
const page = await context.newPage();
// 自动关闭 window.open 弹出的(模拟网关)页面,避免干扰;只关非主页面
context.on('page', (p) => { if (p !== page) p.close().catch(() => {}); });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

let orderNo = null, paymentNo = null;
page.on('response', async (r) => {
  const u = r.url();
  try {
    if (u.includes('/buyer/order') && u.endsWith('/buyer/order')) {
      const j = await r.json(); if (j?.data?.order_no) orderNo = j.data.order_no;
    } else if (u.includes('/pay') && u.includes('/buyer/order/')) {
      const j = await r.json(); if (j?.data?.payment_no) paymentNo = j.data.payment_no;
    }
  } catch { /* non-json */ }
});

try {
  log('1) 打开应用');
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 20000 });

  log('2) 等首页商品渲染(来自后端 /s/demo)');
  await page.getByText('演示商品').first().waitFor({ timeout: 15000 });
  log('   ✓ 首页渲染了真实商品');

  log('3) 点击商品 → 详情');
  await page.getByText('演示商品').first().click();
  await page.getByRole('button', { name: /购买/ }).first().waitFor({ timeout: 10000 });

  log('4) 填邮箱 + 下单');
  const email = page.locator('input[type="email"], input[placeholder*="邮箱"], input[placeholder*="@"]').first();
  if (await email.count()) await email.fill('e2e@demo.com');
  else await page.locator('input').first().fill('e2e@demo.com');
  await page.getByRole('button', { name: /购买/ }).first().click();

  log('5) 等支付页 + 拿 order_no');
  await page.getByRole('button', { name: /确认支付/ }).first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 20 && !orderNo; i++) await page.waitForTimeout(250);
  if (!orderNo) fail('未捕获 order_no(下单可能失败)');
  log('   ✓ 订单已创建:', orderNo);

  log('6) 点确认支付 → 触发 api.pay,开始轮询发货');
  await page.getByRole('button', { name: /确认支付/ }).first().click();
  for (let i = 0; i < 40 && !paymentNo; i++) await page.waitForTimeout(250);
  if (!paymentNo) fail('未捕获 payment_no(发起支付可能失败)');
  log('   ✓ 支付单:', paymentNo);

  log('7) 触发验签正确的回调(模拟网关付款成功)');
  const ack = fireCallback(paymentNo);
  log('   网关应答:', JSON.stringify(ack));
  if (!ack.startsWith('success')) fail('回调未返回 success:' + ack);

  log('8) 等前端轮询拿到发货 → 卡密出现');
  await page.getByText(/卡密已发放/).first().waitFor({ timeout: 30000 });
  const cardText = (await page.locator('.mk-cardkey__code').first().textContent().catch(() => '')) || '(已发放)';
  log('   ✓ 页面展示卡密:', cardText.trim());

  await page.screenshot({ path: 'e2e/result.png', fullPage: true });
  log('   截图 → e2e/result.png');

  if (errors.length) { log('⚠ 控制台错误:'); errors.forEach((e) => log('   -', e)); }
  log(errors.length ? '✅ 主链路通过(有控制台告警,见上)' : '✅ 主链路完全通过,无控制台错误');
} catch (e) {
  await page.screenshot({ path: 'e2e/error.png', fullPage: true }).catch(() => {});
  console.error('[e2e] 异常:', e.message);
  if (errors.length) { console.error('[e2e] 控制台错误:'); errors.forEach((x) => console.error('   -', x)); }
  await browser.close();
  process.exit(1);
} finally {
  await browser.close().catch(() => {});
}
