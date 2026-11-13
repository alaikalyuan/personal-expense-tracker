import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.locator('input[placeholder^="Contoh: Makan Bareng"]').fill("[A002] Makan bareng uji");
// items: first row exists
const fillRow=async(i,name,price,qty)=>{ const n=page.locator('input[placeholder^="Menu #"]').nth(i); await n.fill(name); const row=n.locator('xpath=ancestor::div[.//input[@type="number"]][1]'); const nums=row.locator('input[type=number]'); if(qty) await nums.nth(0).fill(String(qty)); await nums.nth(1).fill(String(price)); };
await fillRow(0,"[A002] Nasi goreng",25000,1);
await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(300);
await fillRow(1,"[A002] Ayam bakar",32000,1);
await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(300);
await fillRow(2,"[A002] Es jeruk",8000,3);
await page.waitForTimeout(500);
const summary=()=>page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Ringkasan Perhitungan'); return t.slice(i,i+700).replace(/\n+/g,' | ')});
console.log("ITEMS ONLY (host):", await summary());
// add participants after items
const pin=page.locator('input[placeholder^="Ketik nama teman"]');
await pin.fill("[A002] Rina"); await page.getByRole('button',{name:'Tambah',exact:true}).click(); await page.waitForTimeout(300);
await pin.fill("[A002] Dimas"); await page.getByRole('button',{name:'Tambah',exact:true}).click(); await page.waitForTimeout(500);
console.log("AFTER ADDING 2 FRIENDS (no assign):", await summary());
await shot(page,"D","E02-items-after-friends",{fullPage:true});
// dump item assignment chips
console.log(await page.evaluate(()=>{const els=[...document.querySelectorAll('input[placeholder^="Menu #"]')]; return els.map(e=>{const row=e.closest('div[class*="rounded"]'); return (row?row.innerText:'').replace(/\n+/g,' | ')})}));
await b.close();
