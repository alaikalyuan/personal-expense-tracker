import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
const reqs=[]; page.on('request',r=>{ if(r.method()==='POST') reqs.push(r.url()+' '+(r.headers()['next-action']||'').slice(0,8)); });
const inp = page.locator('input[placeholder*="cth"]').first();
// A: dblclick button, modal closes (default)
await inp.fill("[A002] kopi 18rb"); await page.waitForTimeout(500);
const btn = page.locator('button[type=submit]').filter({hasText:'Tambah pengeluaran'}).first();
await btn.dblclick({delay:0}).catch(e=>console.log("dbl err",e.message.slice(0,80)));
await page.waitForTimeout(3000);
console.log("A dblclick POSTs:", reqs.length);
console.log(await txt(page,700));
// B: Tetap buka + rapid 3 enters
reqs.length=0;
await openAdd(page);
await page.locator('input[type=checkbox]').first().check(); 
await inp.fill("[A002] gojek 22.500 kemarin"); await page.waitForTimeout(500);
await inp.press("Enter"); await inp.press("Enter"); await inp.press("Enter");
await page.waitForTimeout(3000);
console.log("B 3xEnter keepOpen POSTs:", reqs.length);
await shot(page,"D","B04-keepopen");
console.log(await txt(page,1200));
await b.close();
