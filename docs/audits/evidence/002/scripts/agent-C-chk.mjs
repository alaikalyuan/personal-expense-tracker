import * as c from "./agent-C-common.mjs";
const b = await c.launch();
for (const r of ["empty","typical"]) {
  const f = await c.stateFor(b, r);
  const ctx = await c.ctxWith(b, f, "375x812","light"); const p = await ctx.newPage();
  await p.goto(c.BASE+"/savings"); await p.waitForLoadState("networkidle").catch(()=>{});
  console.log(r, (await p.evaluate(()=>document.body.innerText)).slice(0,60).replace(/\n/g," "));
  await p.waitForTimeout(3000);
  await p.goto(c.BASE+"/archive"); await p.waitForLoadState("networkidle").catch(()=>{});
  console.log(r, "later", (await p.evaluate(()=>document.body.innerText)).slice(0,60).replace(/\n/g," "));
}
await b.close();
