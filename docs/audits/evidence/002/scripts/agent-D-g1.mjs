import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
// make sure we're in Dompet Utama
await page.getByText('Semua Saku').first().click().catch(()=>{}); await page.waitForTimeout(400);
let block=false; let blocked=0;
await page.route('**/*', route=>{ const r=route.request(); if(block && r.method()==='POST' && r.headers()['next-action']){ blocked++; return route.abort('failed'); } return route.continue(); });
const countRows=async()=>{ await page.reload(); await page.waitForTimeout(1800); const t=await page.evaluate(()=>document.body.innerText); return (t.match(/\[A002\] G-test/g)||[]).length; };
// --- Case 1: server action aborted ---
await openAdd(page);
const inp=page.locator('input[placeholder*="cth"]').first(); await inp.fill("[A002] G-test aborted 9rb"); await page.waitForTimeout(500);
block=true; await inp.press("Enter");
for (const w of [500,2500]) { await page.waitForTimeout(w); console.log("CASE1 aborted t+"+w, "blocked="+blocked, "| dialog open:", await page.locator('[role=dialog]').count(), "|", await page.evaluate(()=>{const t=(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | '); return t.slice(-260)}), "| input value:", await inp.inputValue().catch(()=>'(gone)')); }
await shot(page,"D","G01-expense-aborted");
// restore & retry
block=false; 
const open1 = await page.locator('[role=dialog]').count();
if(open1){ await inp.press("Enter"); await page.waitForTimeout(2500); }
console.log("after retry dialog open:", await page.locator('[role=dialog]').count());
console.log("rows named G-test after reload:", await countRows());
// --- Case 2: offline ---
await goHome(page); await openAdd(page);
const inp2=page.locator('input[placeholder*="cth"]').first(); await inp2.fill("[A002] G-test offline 7rb"); await page.waitForTimeout(400);
await ctx.setOffline(true); await inp2.press("Enter");
for (const w of [800,6000]) { await page.waitForTimeout(w); console.log("CASE2 offline t+"+w,"| dialog open:", await page.locator('[role=dialog]').count(), "|", await page.evaluate(()=>{const t=(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | '); return t.slice(-240)}), "| input:", await inp2.inputValue().catch(()=>'(gone)')); }
await shot(page,"D","G02-expense-offline");
await ctx.setOffline(false); await page.waitForTimeout(500);
if(await page.locator('[role=dialog]').count()){ await inp2.press("Enter"); await page.waitForTimeout(3000); }
console.log("rows named G-test after reload:", await countRows());
await b.close();
