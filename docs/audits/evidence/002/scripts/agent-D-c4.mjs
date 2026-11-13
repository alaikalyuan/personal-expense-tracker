import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
await page.getByRole('button',{name:'Cari pengeluaran'}).click(); await page.waitForTimeout(500);
await page.locator('input[type=search]').first().fill("bioskop"); await page.waitForTimeout(600);
const rf = page.getByText('Reset filter').first(); console.log("reset h:", (await rf.boundingBox())?.height);
await rf.click(); await page.waitForTimeout(500);
console.log("after reset input visible?", await page.locator('input[type=search]').count(), "|", await txt(page,300));
// archive
await page.goto("http://localhost:3100/archive"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
console.log("ARCHIVE:", await txt(page,1500));
await shot(page,"D","C08-archive");
console.log(await page.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.type+'|'+i.placeholder).join(';')));
await b.close();
