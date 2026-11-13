import * as c from "./agent-C-common.mjs";
const b = await c.launch();
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", "light");
const p = await ctx.newPage();
for (const r of ["/","/savings","/subscriptions","/split"]) {
await p.goto(c.BASE+r); await p.waitForLoadState("networkidle"); await c.sleep(500);
console.log(r, JSON.stringify(await p.$$eval('button,a[href]', e=>e.filter(x=>x.getBoundingClientRect().width>0).map(x=>(x.getAttribute("aria-label")||x.innerText||"").trim().replace(/\s+/g," ").slice(0,28)+(x.tagName==="A"?"->"+x.getAttribute("href").slice(0,20):"")))));
}
await b.close();
