import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch:true, isMobile:true });
const page = await ctx.newPage();
await login(page, "typical");
await page.goto(BASE+"/subscriptions"); await page.waitForLoadState("networkidle");
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>!b.innerText.trim()).map(b=>b.outerHTML.slice(0,260)).join("\n\n")));
await b.close();
