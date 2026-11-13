import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
await page.getByRole('button',{name:'Asisten Keuangan AI'}).click(); await page.waitForTimeout(1000);
const box=page.locator('[role=dialog] textarea').last();
await box.fill("Berapa total pengeluaran saya hari ini dan apa yang terbesar?"); await box.press("Enter");
await page.waitForTimeout(8000);
console.log(await page.evaluate(()=>{const d=[...document.querySelectorAll('[role=dialog]')].slice(-1)[0]; const t=d.innerText.replace(/\n+/g,' | '); return t.slice(t.indexOf('hari ini dan apa')-0, t.indexOf('hari ini dan apa')+700)}));
await shot(page,"D","AI04-answer2");
// error state: abort the advisor API (no cost)
await page.route('**/api/ai/advisor', r=>r.abort('failed'));
await box.fill("tes error"); await box.press("Enter"); await page.waitForTimeout(3000);
console.log("ERROR STATE:", await page.evaluate(()=>{const d=[...document.querySelectorAll('[role=dialog]')].slice(-1)[0]; const t=d.innerText.replace(/\n+/g,' | '); return t.slice(t.indexOf('tes error'), t.indexOf('tes error')+300)}));
await shot(page,"D","AI05-error-state");
console.log("counter:", await page.evaluate(()=>(document.querySelector('[role=dialog]').innerText.match(/\d+\/20/)||[])[0]));
await b.close();
