import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const summary=()=>page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Perkiraan Tanggungan'); const j=t.indexOf('Total Tagihan',i); return t.slice(i,j).replace(/\n+/g,' | ')});
const rowOf=(i)=>page.locator('input[placeholder^="Menu #"]').nth(i).locator('xpath=ancestor::div[.//input[@type="number"]][1]');
const fill=async(i,name,price,qty)=>{ const n=page.locator('input[placeholder^="Menu #"]').nth(i); await n.fill(name); const nums=rowOf(i).locator('input[type=number]'); await nums.nth(0).fill(String(qty)); await nums.nth(1).fill(String(price)); };
await page.locator('input[placeholder^="Contoh: Makan Bareng"]').fill("[A002] Makan bareng uji");
await fill(0,"[A002] Nasi goreng",25000,1);
for (const [i,n,p,q] of [[1,"[A002] Ayam bakar",32000,1],[2,"[A002] Es jeruk",8000,3],[3,"[A002] Kerupuk",6000,1]]) { await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(250); await fill(i,n,p,q); }
const pin=page.locator('input[placeholder^="Ketik nama teman"]');
const addP=async(n)=>{ await pin.fill(n); await page.getByRole('button',{name:'Tambah',exact:true}).click(); await page.waitForTimeout(300); };
await addP("[A002] Rina"); await addP("[A002] Dimas");
// chip toggler by item index and name
const chip=(i,name)=>page.locator('input[placeholder^="Menu #"]').nth(i).locator('xpath=ancestor::div[contains(@class,"rounded")][1]').getByRole('button',{name:new RegExp(name)});
const tog=async(i,name)=>{ await chip(i,name).click(); await page.waitForTimeout(200); };
await tog(0,"Rina"); await tog(0,"Dimas");           // Nasi goreng: host
await tog(1,"audit002"); await tog(1,"Dimas");      // Ayam bakar: Rina
await tog(3,"audit002");                             // Kerupuk: Rina+Dimas
console.log("S3 assigned like typical:", await summary());
// add participant AFTER explicit assignment
await addP("[A002] Sari");
console.log("S4 add Sari after assignment:", await summary());
console.log("Sari on which items:", await page.evaluate(()=>[...document.querySelectorAll('input[placeholder^="Menu #"]')].map(e=>{const r=e.closest('div[class*="rounded"]'); return [...r.querySelectorAll('button')].filter(x=>/Sari/.test(x.innerText)).length+':'+(r.innerText.match(/Bagi ke Semua \(\d\)/)||[''])[0]})));
// remove Sari
await page.locator('button',{hasText:/\[A002\] Sari/}).locator('..').getByText('×').first().click().catch(async()=>{ await page.getByRole('button',{name:/Hapus.*Sari|Remove.*Sari/}).click().catch(()=>console.log('no remove for Sari')); });
await page.waitForTimeout(400); console.log("S5 after removing Sari:", await summary());
// remove Rina (sole assignee of Ayam bakar)
await page.locator('span,div,button',{hasText:/^\[A002\] Rina\s*×?$/}).first().locator('xpath=.//*[normalize-space()="×"]').first().click().catch(()=>console.log('no x for Rina'));
await page.waitForTimeout(400); console.log("S6 after removing Rina (sole on Ayam bakar):", await summary());
await shot(page,"D","E07-after-remove-rina",{fullPage:true});
console.log("items:", await page.evaluate(()=>[...document.querySelectorAll('input[placeholder^="Menu #"]')].map(e=>{const r=e.closest('div[class*="rounded"]'); return e.value+' => '+r.innerText.replace(/\n+/g,' | ').slice(-110)})));
await b.close();
