import { open, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await page.goto("http://localhost:3100/saku"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Tambah Saku'}).click(); await page.waitForTimeout(700);
const d=page.locator('[role=dialog]').last();
console.log("DIALOG:", (await d.innerText()).replace(/\n+/g,' | ')); 
console.log(await d.evaluate(e=>[...e.querySelectorAll('input,select,textarea,button')].map(i=>i.tagName+':'+i.type+':'+i.inputMode+':'+i.placeholder+':'+i.value+':'+(i.innerText||'').slice(0,20)).join('\n')));
await shot(page,"D","K02-saku-form");
await b.close();
