import { launch, newContext, login, BASE, overflow, shot } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, { viewport: { width: 320, height: 640 } }); const p = await ctx.newPage();
await login(p, "typical");
for (const r of ["/subscriptions", "/split/new", "/", "/savings"]) { await p.goto(BASE + r); await p.waitForTimeout(1500); const o = await overflow(p); console.log(r, "scrollWidth", o.scrollWidth, "vw", o.viewport, "overflowX", o.overflowX); }
await p.goto(BASE + "/subscriptions"); await p.waitForTimeout(1200); await shot(p, "lead", "subscriptions-320", { fullPage: true });
for (const r of ["/split/00000000-0000-0000-0000-000000000000", "/saku/00000000-0000-0000-0000-000000000000", "/does-not-exist"]) { const resp = await p.goto(BASE + r); console.log(r, "HTTP", resp.status(), "| title:", await p.title(), "|", (await p.locator("body").innerText()).slice(0, 60).replace(/\s+/g, " ")); }
console.log("viewport meta:", await p.locator('meta[name=viewport]').getAttribute("content"));
await b.close();
