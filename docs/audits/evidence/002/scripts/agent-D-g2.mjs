import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
let block=false, blocked=0;
await page.route('**/*', route=>{ const r=route.request(); if(block && r.method()==='POST' && r.headers()['next-action']){ blocked++; return route.abort('failed'); } return route.continue(); });
const d=()=>page.locator('[role=dialog]').last();
// ---- savings: deposit
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const bal=()=>page.evaluate(()=>{const t=document.body.innerText.replace(/\n+/g,' | '); return t.slice(t.indexOf('Tabungan Pokok'),t.indexOf('Tabungan Pokok')+60)});
console.log("balance before:", await bal());
await page.getByRole('button',{name:'Catat setor atau tarik'}).click(); await page.waitForTimeout(600);
await d().locator('input[type=number]').fill("5000"); await d().locator('input[type=text]').fill("[A002] G-test deposit");
block=true; await d().getByRole('button',{name:'Simpan'}).click();
for (const w of [800,2500]) { await page.waitForTimeout(w); console.log("SAVINGS aborted t+"+w,"blocked="+blocked,"| dialog open:", await page.locator('[role=dialog]').count(), "|", await page.evaluate(()=>{const t=(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | '); return t.slice(0,300)}), "| alert()?"); }
await shot(page,"D","G03-savings-aborted");
block=false; await d().getByRole('button',{name:'Simpan'}).click().catch(()=>{}); await page.waitForTimeout(2500);
await page.reload(); await page.waitForTimeout(1800);
console.log("balance after retry:", await bal(), "| G-test deposit rows:", (await page.evaluate(()=>document.body.innerText.match(/G-test deposit/g)||[])).length);
// ---- savings: offline create goal
await page.getByRole('button',{name:'Tambah Target Baru'}).click(); await page.waitForTimeout(600);
await d().locator('input[type=text]').fill("[A002] G-test goal"); await d().locator('input[type=number]').fill("100000");
await ctx.setOffline(true); await d().getByRole('button',{name:'Simpan'}).click(); await page.waitForTimeout(3000);
console.log("GOAL offline | dialog open:", await page.locator('[role=dialog]').count(), "|", await page.evaluate(()=>{const t=(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | '); return t.slice(0,260)}));
await shot(page,"D","G04-goal-offline");
await ctx.setOffline(false);
await d().getByRole('button',{name:'Simpan'}).click().catch(()=>{}); await page.waitForTimeout(2500);
await page.reload(); await page.waitForTimeout(1500);
console.log("goal rows after retry:", (await page.evaluate(()=>document.body.innerText.match(/G-test goal/g)||[])).length);
await b.close();
