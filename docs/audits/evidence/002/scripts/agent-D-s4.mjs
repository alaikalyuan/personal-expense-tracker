import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
console.log("SAVINGS:", await page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Target Tabungan'); return t.slice(i,i+700).replace(/\n+/g,' | ')}));
await shot(page,"D","S08-goal-target-2");
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>(e.innerText||e.getAttribute('aria-label')||e.title||'?').trim().replace(/\n/g,' ').slice(0,30)+'@'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).join(' ; ')));
await b.close();
