import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
await page.getByRole('button',{name:'Upload Foto'}).click(); await page.waitForTimeout(800);
const net=[]; page.on('request',r=>{if(r.method()==='POST')net.push(r.url()+' '+(r.headers()['next-action']||'').slice(0,6))});
await page.locator('input[type=file]').nth(1).setInputFiles("../agents/D/receipt-A002.png");
await page.waitForTimeout(1500); await shot(page,"D","B16-photo-crop");
await page.getByRole('button',{name:'Proses dengan AI'}).click();
for (const w of [800,3000,6000,10000]) { await page.waitForTimeout(w); await shot(page,"D","B17-photo-ai-"+w); console.log("after +"+w, await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ').slice(0,900)).join('')));}
console.log("POSTs:",net);
await b.close();
