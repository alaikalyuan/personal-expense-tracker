import * as c from "./agent-C-common.mjs";
const b = await c.launch();
for (const r of ["typical","large","empty"]) { await c.stateFor(b, r); console.log("state ok", r); }
// first wallet id
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", "light");
const p = await ctx.newPage(); await p.goto(c.BASE+"/saku"); await p.waitForLoadState("networkidle");
const hrefs = await p.$$eval('a[href^="/saku/"]', a=>a.map(x=>x.getAttribute("href")));
console.log(hrefs);
c.save("wallets.json", hrefs);
await b.close();
