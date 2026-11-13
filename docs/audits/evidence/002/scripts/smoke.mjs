import { launch, newContext, login, BASE, axe } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, { theme: "dark" }); const p = await ctx.newPage();
await login(p, "typical"); await p.goto(BASE + "/");
console.log((await p.locator("body").innerText()).slice(0, 400).replace(/\s+/g, " "));
console.log("html class:", await p.evaluate(() => document.documentElement.className + " | " + JSON.stringify(document.documentElement.dataset)));
const r = await axe(p); console.log("axe violations:", r.violations.map(v => v.id + "x" + v.count).join(", "));
await b.close();
