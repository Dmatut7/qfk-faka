import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let menu = null;
page.on('response', async r => {
  const ct = r.headers()['content-type'] || '';
  if (!ct.includes('json')) return;
  try { const j = await r.json(); if (j?.data?.system?.menu?.length) menu = j.data.system.menu; } catch {}
});
await page.goto('https://fkdemo.jingsoft.com/admin', { waitUntil: 'domcontentloaded', timeout: 50000 }).catch(e => console.log('goto', e.message));
await page.waitForTimeout(3000);
await page.locator('input:not([type=password]):not([type=hidden])').first().fill('admin').catch(() => {});
await page.locator('input[type=password]').first().fill('jingsoft').catch(() => {});
const btn = page.getByRole('button', { name: /登\s*录|login/i }).first();
if (await btn.count()) await btn.click().catch(() => {}); else await page.keyboard.press('Enter');
// 等后台菜单加载,最多 ~15s
for (let i = 0; i < 15 && !menu; i++) await page.waitForTimeout(1000);
if (menu) {
  const byId = {}, roots = [];
  menu.forEach(m => byId[m.id] = { ...m, children: [] });
  menu.forEach(m => { if (m.pid && byId[m.pid]) byId[m.pid].children.push(byId[m.id]); else roots.push(byId[m.id]); });
  let out = '';
  const pr = (n, d) => { out += '  '.repeat(d) + '• ' + n.title + (n.path ? '  [' + n.path + ']' : '') + '\n'; n.children.sort((a, b) => a.sort - b.sort).forEach(c => pr(c, d + 1)); };
  roots.sort((a, b) => a.sort - b.sort).forEach(r => pr(r, 0));
  out += '\nTOTAL: ' + menu.length;
  writeFileSync('/tmp/jf-menu.txt', out);
  console.log(out);
} else console.log('menu NOT captured');
await b.close();
