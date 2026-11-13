import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
await page.goto(BASE+"/split/49b6b834-5267-4822-82bb-f654d1045ee3"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500);
await shot(page,"D","E04-typical-friend-view",{fullPage:true});
console.log("FRIEND VIEW:", await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ')));
console.log("auth cookie:",(await ctx.cookies()).filter(k=>k.name.includes('auth')).length);
console.log(await page.evaluate(()=>[...document.querySelectorAll('button,a')].map(e=>(e.innerText||e.getAttribute('aria-label')||'?').trim().replace(/\n/g,' ').slice(0,40)+'@h'+Math.round(e.getBoundingClientRect().height)).join(' ; ')));
await b.close();
