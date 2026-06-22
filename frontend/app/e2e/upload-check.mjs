import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:5173/console.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);
const ins = p.locator('input'); await ins.nth(0).fill('demo_merchant'); await ins.nth(1).fill('demo123456');
await p.getByRole('button', { name: /登录/ }).first().click(); await p.waitForTimeout(1800);
await p.getByRole('button', { name: '商品管理' }).first().click(); await p.waitForTimeout(1000);
await p.getByRole('button', { name: /新建商品/ }).first().click(); await p.waitForTimeout(700);
// 上传到隐藏 file input
await p.locator('input[type=file]').first().setInputFiles('/tmp/test-up.png'); await p.waitForTimeout(1500);
// 读 URL 输入框值(占位"或粘贴图片 URL")
const url = await p.locator('input[placeholder="或粘贴图片 URL"]').first().inputValue().catch(() => '');
console.log('上传后回填URL:', url || '(空)');
console.log('是否 /uploads/ 路径:', url.includes('/uploads/') ? '✓ 是(上传成功)' : '✗ 否');
console.log('页面错误:', errs.length ? errs : '无');
await b.close();
