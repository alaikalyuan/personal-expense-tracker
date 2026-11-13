import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
await page.goto(BASE+"/split/49b6b834-5267-4822-82bb-f654d1045ee3"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500);
for (const nm of ["Saya","Rina","Dimas"]) { await page.getByText("[A002] "+nm).first().click(); await page.waitForTimeout(500); }
await shot(page,"D","E05-typical-expanded",{fullPage:true});
console.log(await page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Rincian Pembayaran'); return t.slice(i).replace(/\n+/g,' | ')}));
await b.close();
