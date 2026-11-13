import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
console.log("DASH before AI:", await txt(page,330));
await page.getByRole('button',{name:'Asisten Keuangan AI'}).click(); await page.waitForTimeout(1000);
await shot(page,"D","AI01-sheet-open");
console.log("SHEET:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>'aria-modal='+d.getAttribute('aria-modal')+' '+d.innerText.replace(/\n+/g,' | ').slice(0,700)).join('')));
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog] textarea,[role=dialog] input')].map(i=>i.tagName+':'+i.placeholder+':'+(i.getAttribute('aria-label')||''))));
const reqs=[]; page.on('request',r=>{ if(r.method()==='POST') reqs.push(r.url().replace('http://localhost:3100','')); });
const box=page.locator('[role=dialog] textarea, [role=dialog] input[type=text]').last();
await box.fill("Berapa sisa budget minggu ini?"); await box.press("Enter");
const t0=Date.now();
for (const w of [800,3000,6000,10000]) { await page.waitForTimeout(w); console.log("AI t+"+Math.round((Date.now()-t0)/1000)+"s:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ').slice(-600)).join(''))); if(w===800) await shot(page,"D","AI02-loading"); }
await shot(page,"D","AI03-answer1");
console.log("POSTs:",reqs);
await b.close();
