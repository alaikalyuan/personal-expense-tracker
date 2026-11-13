import { launch, newContext, shot, BASE } from "./lib.mjs";
import { readFileSync } from "node:fs";
const url = readFileSync("../out/_D_split_url.txt","utf8").trim();
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
await page.goto(url); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Kode QR'}).click(); await page.waitForTimeout(1200);
await shot(page,"D","E12-qr");
console.log("QR dialog:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].map(d=>'aria-modal='+d.getAttribute('aria-modal')+' '+d.innerText.replace(/\n+/g,' | ')).join('##')), "imgs:", await page.locator('[role=dialog] img, [role=dialog] canvas').count());
await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log("Escape closes:", (await page.locator('[role=dialog]').count())===0);
// whatsapp link href
console.log(await page.evaluate(()=>[...document.querySelectorAll('a')].map(a=>a.innerText.trim()+' -> '+(a.href||'').slice(0,140))));
await b.close();
