import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const p = await c.newPage();
await p.goto('http://127.0.0.1:5173/console.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);
await p.getByText('平台登录').click(); await p.waitForTimeout(300);
const ins = p.locator('input'); await ins.nth(0).fill('admin'); await ins.nth(1).fill('admin123');
await p.getByRole('button', { name: /登录/ }).first().click(); await p.waitForTimeout(1800);
await p.getByRole('button', { name: '内容管理' }).first().click(); await p.waitForTimeout(900);
await p.getByRole('button', { name: '资讯' }).first().click(); await p.waitForTimeout(900);
const del = p.getByRole('button', { name: /删除/ }).first();
if (await del.count()) { await del.click(); await p.waitForTimeout(400); await p.getByRole('button', { name: '确认删除' }).click(); await p.waitForTimeout(1000); console.log('已清理测试资讯'); }
else console.log('无测试资讯');
await b.close();
