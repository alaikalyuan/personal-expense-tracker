import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
await page.getByRole('button',{name:'Upload Foto'}).click(); await page.waitForTimeout(800);
const net=[]; page.on('request',r=>{if(r.method()==='POST')net.push(r.url())});
await page.locator('input[type=file]').nth(1).setInputFiles("../agents/D/receipt-A002.png");
for (const s of [1,3,8,15]) { await page.waitForTimeout(s==1?1000:s==3?2000:s==8?5000:7000); await shot(page,"D","B16-photo-t"+s); console.log("t~"+s, await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].map(d=>d.innerText.replace(/\n+/g,' | ').slice(0,700)).join('\n##\n'))); }
console.log("POST urls:",net);
await b.close();
