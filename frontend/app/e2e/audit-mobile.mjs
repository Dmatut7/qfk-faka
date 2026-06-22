import { chromium } from 'playwright-core';
const APP='http://127.0.0.1:5173';
const b=await chromium.launch({channel:'chrome',headless:true});
const out=new URL('./mobile/',import.meta.url).pathname;
async function ctx(w,h){const c=await b.newContext({viewport:{width:w,height:h}});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());return c;}
const s=(p,ms=1500)=>p.waitForTimeout(ms);
const done=[];
async function shot(p,n){try{await p.screenshot({path:out+n+'.png',fullPage:true});done.push(n);console.log('✓',n);}catch(e){console.log('✗',n,e.message);}}
// 买家 移动端 390
let c=await ctx(390,844),p=await c.newPage();
const e1=[];p.on('pageerror',e=>e1.push(String(e)));
await p.goto(APP+'/',{waitUntil:'domcontentloaded'});await s(p,2600);
await shot(p,'m-buyer-home');
try{await p.locator('.mk-pc').first().click();await s(p);await shot(p,'m-buyer-detail');}catch(e){console.log('detail',e.message);}
await c.close();
c=await ctx(390,844);p=await c.newPage();
await p.goto(APP+'/',{waitUntil:'domcontentloaded'});await s(p,1500);
try{await p.getByText(/取卡|查单/).first().click();await s(p);await shot(p,'m-buyer-lookup');}catch(e){console.log('lookup',e.message);}
try{await p.goto(APP+'/',{waitUntil:'domcontentloaded'});await s(p,800);await p.getByText(/平台|门户/).first().click();await s(p);await shot(p,'m-buyer-portal');}catch(e){console.log('portal',e.message);}
console.log('买家移动错误:',e1.length?[...new Set(e1)]:'无');
await c.close();
// 后台 移动端 414(抽屉态)
async function consoleM(prefix,role,user,pass){
  const cc=await ctx(414,896),pg=await cc.newPage();
  await pg.goto(APP+'/console.html',{waitUntil:'domcontentloaded'});await s(pg,900);
  if(role==='admin'){try{await pg.getByText('平台登录').click();await s(pg,300);}catch{}}
  const ins=pg.locator('input');await ins.nth(0).fill(user);await ins.nth(1).fill(pass);
  await pg.getByRole('button',{name:/登录/}).first().click();await s(pg,1800);
  await shot(pg,prefix+'-dashboard');
  try{await pg.getByRole('button',{name:/打开菜单/}).click();await s(pg,600);await shot(pg,prefix+'-drawer');}catch(e){console.log('drawer',e.message);}
  await cc.close();
}
await consoleM('m-merchant','merchant','demo_merchant','demo123456');
await consoleM('m-admin','admin','admin','admin123');
await b.close();
console.log('完成',done.length,'张');
