import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const d=()=>page.locator('[role=dialog]').last();
await page.getByRole('button',{name:'Catat setor atau tarik'}).click(); await page.waitForTimeout(600);
await d().locator('input[type=number]').fill("999999999"); await d().locator('input[type=text]').fill("[A002] koreksi overdraw");
await d().getByRole('button',{name:'Simpan'}).click(); await page.waitForTimeout(2500);
console.log(await page.evaluate(()=>{const t=document.body.innerText.replace(/\n+/g,' | '); return t.slice(t.indexOf('Tabungan Pokok'),t.indexOf('Tabungan Pokok')+110)}));
// dashboard & menu cross-check
await page.goto("http://localhost:3100/"); await page.waitForTimeout(2000);
console.log("DASH text mention tabungan:", await page.evaluate(()=>document.body.innerText.includes('Tabungan')));
await b.close();
