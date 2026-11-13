import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const summary=()=>page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Ringkasan Perhitungan'); return t.slice(i,i+800).replace(/\n+/g,' | ')});
await page.locator('input[placeholder^="Contoh: Makan Bareng"]').fill("[A002] Makan bareng uji");
const rowOf=(i)=>page.locator('input[placeholder^="Menu #"]').nth(i).locator('xpath=ancestor::div[.//input[@type="number"]][1]');
const fill=async(i,name,price,qty)=>{ const n=page.locator('input[placeholder^="Menu #"]').nth(i); await n.fill(name); const nums=rowOf(i).locator('input[type=number]'); await nums.nth(0).fill(String(qty)); await nums.nth(1).fill(String(price)); };
// Step 1: items first (host only participant)
await fill(0,"[A002] Nasi goreng",25000,1);
await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(250);
await fill(1,"[A002] Ayam bakar",32000,1);
await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(250);
await fill(2,"[A002] Es jeruk",8000,3);
await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(250);
await fill(3,"[A002] Kerupuk",6000,1);
console.log("S1 items-only:", await summary());
// Step 2: add participants AFTER items
const pin=page.locator('input[placeholder^="Ketik nama teman"]');
for (const n of ["[A002] Rina","[A002] Dimas"]) { await pin.fill(n); await page.getByRole('button',{name:'Tambah',exact:true}).click(); await page.waitForTimeout(300); }
console.log("S2 after friends added:", await summary());
console.log("chips state:", await page.evaluate(()=>[...document.querySelectorAll('input[placeholder^="Menu #"]')].map(e=>{const r=e.closest('div[class*="rounded"]'); return [...r.querySelectorAll('button')].filter(x=>/Host|Rina|Dimas|audit/.test(x.innerText)).map(x=>x.innerText.trim()+(x.className.includes('bg-ink')||x.className.includes('dark')||x.querySelector('svg')?'*':'')).join(',')+' || '+(r.innerText.match(/Bagi ke Semua \(\d\)|Pilih Semua|Batal Semua/g)||[])})));
await shot(page,"D","E06-before-assign",{fullPage:true});
await ctx.storageState({path:"../out/_D_journey_state.json"});
console.log("URL", page.url());
await b.close();
