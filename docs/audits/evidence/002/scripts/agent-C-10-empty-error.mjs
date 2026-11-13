import * as c from "./agent-C-common.mjs";
const b = await c.launch(); const res={}; for (const r of ["empty","typical"]) await c.stateFor(b,r);
for (const vp of ["375x812","1280x800"]) {
const ctx = await c.ctxWith(b, c.DATA+"/state-empty.json", vp, "light");
const p = await ctx.newPage();
for (const r of ["/","/savings","/saku","/subscriptions","/split","/compare","/archive","/saku/00000000-0000-0000-0000-000000000000","/split/00000000-0000-0000-0000-000000000000","/does-not-exist"]) {
  const resp = await p.goto(c.BASE+r); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(700);
  const nm=c.slug(r.replace("00000000-0000-0000-0000-000000000000","NIL")); 
  const text = await p.evaluate(()=>document.body.innerText.trim());
  const ov=await c.overflow(p); const bc=await c.bottomCheck(p);
  const acts = await p.$$eval("main a, main button",e=>e.filter(x=>x.getBoundingClientRect().width>0).map(x=>(x.innerText||x.getAttribute("aria-label")||"").trim().slice(0,30)).filter(Boolean));
  res[nm+"@"+vp]={status:resp.status(), title:await p.title(), ovx:ov.overflowX, gap:bc.gap, acts, text:text.slice(0,700)};
  console.log(nm,vp,resp.status(),"ovx",ov.overflowX,"gap",bc.gap);
  await p.evaluate(()=>scrollTo(0,0));
  await p.screenshot({path:`${c.SHOTS}/empty-${nm}__${vp}__light__${vp==="375x812"?"full":"vp"}.png`, fullPage: vp==="375x812"});
}
await ctx.close();
}
// error pages in dark + signed-in typical, 375
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", "dark"); const p = await ctx.newPage();
for (const r of ["/does-not-exist","/split/00000000-0000-0000-0000-000000000000","/saku/00000000-0000-0000-0000-000000000000"]) {
  const resp=await p.goto(c.BASE+r); await c.sleep(800); const nm=c.slug(r.replace("00000000-0000-0000-0000-000000000000","NIL"));
  res["typical-"+nm+"-dark"]={status:resp.status(), text:(await p.evaluate(()=>document.body.innerText)).slice(0,300)};
  await p.screenshot({path:`${c.SHOTS}/error-${nm}__375x812__dark__vp.png`});
}
c.save("empty-error.json",res); await b.close();
