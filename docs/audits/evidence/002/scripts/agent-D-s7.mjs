import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{const t=document.body.innerText.replace(/\n+/g,' | '); const g=(k,n)=>t.slice(t.indexOf(k),t.indexOf(k)+n); return g('Tabungan Pokok',110)+' ## '+g('Total Masuk',110);}));
await shot(page,"D","S13-after-overdraw",{fullPage:true});
console.log(await page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Belum Ada Catatan')>0?0:t.indexOf('Semua'); return t.slice(t.indexOf('Total Keluar'),t.indexOf('Total Keluar')+900).replace(/\n+/g,' | ')}));
await b.close();
