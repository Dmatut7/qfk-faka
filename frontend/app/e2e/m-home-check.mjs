import { chromium } from 'playwright-core';
const b=await chromium.launch({channel:'chrome',headless:true});
const c=await b.newContext({viewport:{width:390,height:844}});
await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
const p=await c.newPage();
await p.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2600);
// 只截顶栏区域(viewport 顶部),看清楚
await p.screenshot({path:'e2e/mobile/m-home-topbar.png',clip:{x:0,y:0,width:390,height:130}});
console.log('done');
await b.close();
