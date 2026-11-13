import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await page.goto("http://localhost:3100/split"); await page.waitForTimeout(2000);
console.log("SPLIT LIST:", await txt(page,700)); await shot(page,"D","E00-split-list");
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await shot(page,"D","E01-split-new",{fullPage:true});
console.log("NEW:", await txt(page,2500));
console.log(await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea,button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.tagName+'|'+e.type+'|'+e.inputMode+'|v='+e.value+'|ph='+e.placeholder+'|'+(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\n/g,' ').slice(0,28)+'|y'+Math.round(e.getBoundingClientRect().y)+'h'+Math.round(e.getBoundingClientRect().height)).join('\n')));
await b.close();
