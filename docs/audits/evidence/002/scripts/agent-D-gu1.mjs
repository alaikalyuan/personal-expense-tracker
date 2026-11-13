import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("guest");
await goHome(page);
await page.getByRole('link',{name:'Patungan'}).first().click(); 
for (const w of [300,1500]) { await page.waitForTimeout(w); console.log("t+"+w, page.url(), await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,140)), "| toast?", await page.locator('[role=status],[role=alert]').count()); }
await shot(page,"D","A13-guest-tap-patungan");
// guest subscriptions page text
await page.goto("http://localhost:3100/subscriptions"); await page.waitForTimeout(1500); await shot(page,"D","A14-guest-subscriptions");
// guest compare, savings
await page.goto("http://localhost:3100/savings"); await page.waitForTimeout(1500); console.log("guest savings:", await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,500)));
await b.close();
