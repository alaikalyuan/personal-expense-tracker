import { open, txt, shot } from "./agent-D-h.mjs";
import { readFileSync } from "node:fs";
const url = readFileSync("../out/_D_split_url.txt","utf8").trim();
const {b, page} = await open("journey");
await page.goto(url+"/edit"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.locator('input[placeholder^="Contoh: Makan Bareng"]').fill("[A002] Makan bareng uji (edit)");
await page.getByRole('button',{name:'Simpan Perubahan'}).click();
for (const w of [300,1200,3000]) { await page.waitForTimeout(w); console.log("t+"+w, page.url().replace(/.*split\//,''), await page.evaluate(()=>{const t=document.body.innerText; return (t.match(/(Tersimpan|Berhasil|Gagal|Perubahan)[^|\n]*/g)||[]).join(' || ')})); }
await shot(page,"D","E14-edit-after-save");
await page.goto(url); await page.waitForTimeout(2000);
console.log("DETAIL after edit:", (await txt(page,500)));
await b.close();
