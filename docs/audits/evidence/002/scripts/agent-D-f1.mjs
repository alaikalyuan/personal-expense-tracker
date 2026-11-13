import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/subscriptions"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
console.log("SUBS:", await txt(page,900)); await shot(page,"D","F00-subs-empty");
await page.getByRole('button',{name:/Tambah/}).first().click(); await page.waitForTimeout(800);
await shot(page,"D","F01-sub-form",{fullPage:true});
console.log("FORM:", await page.evaluate(()=>(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | ')));
console.log(await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.tagName+'|'+e.type+'|'+e.inputMode+'|v='+e.value+'|ph='+e.placeholder+'|name='+e.name).join('\n')));
await b.close();
