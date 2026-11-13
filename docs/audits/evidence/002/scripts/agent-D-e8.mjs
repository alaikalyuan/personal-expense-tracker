import { open, goHome, txt, shot } from "./agent-D-h.mjs";
import { writeFileSync } from "node:fs";
const {b, ctx, page} = await open("journey");
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const summary=()=>page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Ringkasan Perhitungan'); return t.slice(i,i+900).replace(/\n+/g,' | ')});
const rowOf=(i)=>page.locator('input[placeholder^="Menu #"]').nth(i).locator('xpath=ancestor::div[.//input[@type="number"]][1]');
const fill=async(i,name,price,qty)=>{ const n=page.locator('input[placeholder^="Menu #"]').nth(i); await n.fill(name); const nums=rowOf(i).locator('input[type=number]'); await nums.nth(0).fill(String(qty)); await nums.nth(1).fill(String(price)); };
await page.locator('input[placeholder^="Contoh: Makan Bareng"]').fill("[A002] Makan bareng uji");
await fill(0,"[A002] Nasi goreng",25000,1);
for (const [i,n,p,q] of [[1,"[A002] Ayam bakar",32000,1],[2,"[A002] Es jeruk",8000,3],[3,"[A002] Kerupuk",6000,1]]) { await page.getByRole('button',{name:'Tambah Menu Lainnya'}).click(); await page.waitForTimeout(250); await fill(i,n,p,q); }
const pin=page.locator('input[placeholder^="Ketik nama teman"]');
for (const n of ["[A002] Rina","[A002] Dimas"]) { await pin.fill(n); await page.getByRole('button',{name:'Tambah',exact:true}).click(); await page.waitForTimeout(300); }
const chip=(i,name)=>page.locator('input[placeholder^="Menu #"]').nth(i).locator('xpath=ancestor::div[contains(@class,"rounded")][1]').getByRole('button',{name:new RegExp(name)});
const tog=async(i,name)=>{ await chip(i,name).click(); await page.waitForTimeout(200); };
await tog(0,"Rina"); await tog(0,"Dimas"); await tog(1,"audit002"); await tog(1,"Dimas"); await tog(3,"audit002");
// tax 10% PB1 and service 5
await page.getByRole('button',{name:/10% PB1/}).click();
const svc=page.locator('input[type=number][placeholder="0"]').first();
console.log("number inputs with ph 0:", await page.locator('input[type=number][placeholder="0"]').count());
await page.waitForTimeout(300);
// service input: find by label
const svcInput = page.getByText('Service Charge (%)').locator('xpath=following::input[1]');
await svcInput.fill("5");
await page.waitForTimeout(500);
console.log("SUMMARY:", await summary());
// payment
await page.getByRole('button',{name:'BCA',exact:true}).click();
await page.locator('input[placeholder^="cth: 1234567890"]').fill("0000000000");
await page.locator('input[placeholder^="cth: Alaikal"]').fill("[A002] Audit");
await shot(page,"D","E08-form-complete",{fullPage:true});
const cbs = await page.evaluate(()=>[...document.querySelectorAll('input[type=checkbox]')].map(c=>c.checked));
console.log("checkboxes checked:",cbs);
await page.getByRole('button',{name:'Publikasikan'}).click(); await page.waitForTimeout(3500);
console.log("URL after publish:", page.url());
console.log(await txt(page,700));
writeFileSync("../out/_D_split_url.txt", page.url());
await shot(page,"D","E09-after-publish");
await b.close();
