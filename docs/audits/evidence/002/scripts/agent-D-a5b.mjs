import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, {storageState:"../out/_D_guest_state.json"});
const page = await ctx.newPage();
await page.goto(BASE); await page.waitForLoadState("networkidle"); await page.waitForTimeout(2000);
console.log((await ctx.cookies()).map(c=>c.name+':'+c.value.length).join(','));
console.log(await page.evaluate(()=>document.body.innerText.slice(0,200)));
await b.close();
