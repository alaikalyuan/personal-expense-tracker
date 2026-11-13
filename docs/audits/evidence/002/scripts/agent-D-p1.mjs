import { launch, newContext, login, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
await login(page,"journey");
await page.goto(BASE); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.getByText('Semua Saku').first().click().catch(()=>{}); await page.waitForTimeout(400);
console.log(await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,330)));
// sign out
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(600);
const posts=[]; page.on('dialog',async d=>{console.log("NATIVE:",d.message()); await d.accept();});
await page.getByText('Keluar').click(); await page.waitForTimeout(3000);
console.log("after Keluar url:", page.url(), "| auth cookie:", (await ctx.cookies()).filter(k=>k.name.includes('auth')).length, "|", (await page.evaluate(()=>document.body.innerText.slice(0,60))).replace(/\n/g,' '));
await shot(page,"D","P01-after-signout");
await b.close();
