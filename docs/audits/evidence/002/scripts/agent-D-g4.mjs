import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
for (const u of ["/nope-xyz","/split/00000000-0000-0000-0000-000000000000","/split/not-a-uuid"]) { const r=await page.goto(BASE+u); await page.waitForTimeout(1500); console.log(u, r.status(), (await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,200)))); await shot(page,"D","G07-"+u.replace(/\W+/g,'_').slice(0,20)); }
await b.close();
