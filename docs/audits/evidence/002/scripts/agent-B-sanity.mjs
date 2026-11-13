import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b,{}); const page = await ctx.newPage(); await login(page,"typical");
for (const u of ["/subscriptions","/split/49b6b834-5267-4822-82bb-f654d1045ee3","/savings","/saku"]) { await page.goto(BASE+u); await page.waitForLoadState("networkidle"); console.log(u, (await page.evaluate(()=>document.body.innerText.match(/\[A002\][^\n]{0,30}/g)||[])).slice(0,6).join(" | ")); }
await b.close();
