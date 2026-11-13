import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/subscriptions"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>[...document.querySelectorAll('button,a')].filter(e=>e.getBoundingClientRect().height>0).map(e=>(e.innerText||e.getAttribute('aria-label')||e.title||'?').trim().replace(/\n/g,' ').slice(0,30)+'@'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).join(' ; ')));
await shot(page,"D","F04-sub-card");
await b.close();
