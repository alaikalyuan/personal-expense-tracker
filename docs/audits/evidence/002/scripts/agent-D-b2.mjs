import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
const inp = page.locator('input[placeholder*="cth"]').first();
for (const s of ["[A002] lunch 15.000","Rp 15.000 [A002] lunch", "[A002] Rp 15.000 lunch"]) { await inp.fill(s); await page.waitForTimeout(500); console.log(JSON.stringify(s),"=>",await preview(page)); }
await inp.fill("Rp 15.000 [A002] lunch"); await page.waitForTimeout(500);
// rapid double Enter
const reqs=[]; page.on('request',r=>{ if(r.method()==='POST') reqs.push(r.url()+' '+(r.headers()['next-action']||'').slice(0,8)); });
await inp.press("Enter"); await inp.press("Enter").catch(()=>{}); 
await page.waitForTimeout(3000);
console.log("POSTs:", reqs.length, reqs);
await shot(page,"D","B03-after-double-enter");
console.log(await txt(page,900));
await b.close();
