import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
page.on('dialog',async x=>{console.log("NATIVE:",x.type(),x.message()); await x.dismiss();});
await page.getByRole('button',{name:/Hapus: \[A002\] Laptop uji/}).click(); await page.waitForTimeout(800);
console.log("goal still there:", await page.getByText('[A002] Laptop uji').count()>0);
// history row delete visibility
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>/hapus|delete/i.test((b.getAttribute('aria-label')||'')+(b.title||'')+b.innerText)).map(b=>({label:(b.getAttribute('aria-label')||b.title||b.innerText).slice(0,40), op:getComputedStyle(b).opacity, w:Math.round(b.getBoundingClientRect().width), h:Math.round(b.getBoundingClientRect().height), cls:String(b.className).includes('group-hover')||String(b.className).includes('opacity-0')}))));
await b.close();
