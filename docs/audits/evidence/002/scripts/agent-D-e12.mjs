import { open, txt, shot } from "./agent-D-h.mjs";
import { readFileSync } from "node:fs";
const url = readFileSync("../out/_D_split_url.txt","utf8").trim();
const {b, page} = await open("journey");
await page.goto(url+"/edit"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500);
console.log("EDIT URL", page.url());
const dump=()=>page.evaluate(()=>({
  title:document.querySelector('input[placeholder^="Contoh: Makan Bareng"]')?.value,
  items:[...document.querySelectorAll('input[placeholder^="Menu #"]')].map(e=>{const r=e.closest('div[class*="rounded"]'); const nums=[...r.querySelectorAll('input[type=number]')].map(n=>n.value); const sel=[...r.querySelectorAll('button')].filter(x=>x.className.includes('bg-ink')||x.querySelector('svg')&&/audit|Rina|Dimas/.test(x.innerText)).map(x=>x.innerText.trim()); return e.value+' '+nums.join('x')+' <- '+sel.join('/')}),
  pills:[...document.querySelectorAll('button')].filter(x=>/10%|Persis|Rp 100|BCA/.test(x.innerText)).map(x=>x.innerText.replace(/\n/g,' ')+':'+(x.className.includes('border-accent')||x.className.includes('ring')?'sel?':'')),
  summary:(()=>{const t=document.body.innerText; const i=t.indexOf('Ringkasan Perhitungan'); return t.slice(i,i+800).replace(/\n+/g,' | ')})(),
  acct:[...document.querySelectorAll('input[type=text]')].map(i=>i.placeholder.slice(0,12)+'='+i.value).filter(s=>/cth|Alaikal/.test(s)),
}));
console.log(JSON.stringify(await dump(),null,1));
await shot(page,"D","E13-edit-form",{fullPage:true});
// edit only note: change title, then save
const t=page.locator('input[placeholder^="Contoh: Makan Bareng"]'); await t.fill("[A002] Makan bareng uji (edit)");
console.log("buttons:", await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height>0).map(b=>b.innerText.trim()).filter(Boolean).slice(-6)));
await page.getByRole('button',{name:/Simpan|Perbarui|Update/}).last().click(); await page.waitForTimeout(3000);
console.log("after save URL", page.url()); console.log(await txt(page,900));
await b.close();
