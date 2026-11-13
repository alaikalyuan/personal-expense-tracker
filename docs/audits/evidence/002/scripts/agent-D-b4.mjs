import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
await page.getByRole('button',{name:'Standar'}).click(); await page.waitForTimeout(600);
await shot(page,"D","B05-standard-form");
console.log(await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea,button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.tagName+'|'+e.type+'|'+(e.inputMode||'')+'|ph='+(e.placeholder||'')+'|name='+e.name+'|req='+e.required+'|min='+(e.min||'')+'|step='+(e.step||'')+'|lbl='+(e.labels&&e.labels[0]?e.labels[0].innerText:'')+'|txt='+e.innerText.trim().slice(0,25)+'|h'+Math.round(e.getBoundingClientRect().height)).join('\n')));
console.log(await page.evaluate(()=>document.querySelector('[role=dialog]')?.innerText.replace(/\n+/g,' | ')));
await b.close();
