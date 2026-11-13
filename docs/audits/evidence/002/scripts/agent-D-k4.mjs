import { open, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await page.goto("http://localhost:3100/saku"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole('button',{name:/Ubah Saku: \[A002\] Saku Kos/}).click(); await page.waitForTimeout(700);
const d=page.locator('[role=dialog]').last();
console.log(await d.evaluate(e=>[...e.querySelectorAll('input')].map(i=>i.type+':'+i.placeholder+':'+(i.type==='checkbox'?i.checked:i.value)).join('\n')));
console.log((await d.innerText()).replace(/\n+/g,' | ').slice(0,500));
await b.close();
