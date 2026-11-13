import * as c from "./agent-C-common.mjs";
const b = await c.launch(); const res={};
for (const vp of ["320x640","375x812","1280x800"]) {
  const ctx = await c.ctxWith(b, c.DATA+"/state-large.json", vp, "light");
  const p = await ctx.newPage();
  for (const r of ["/","/archive","/compare","/savings","/saku","/subscriptions","/split"]) {
    const t0=Date.now(); await p.goto(c.BASE+r,{waitUntil:"load"}); const tl=Date.now()-t0; await p.waitForLoadState("networkidle").catch(()=>{}); const tn=Date.now()-t0; await c.sleep(600);
    const ov = await c.overflow(p); const bc = await c.bottomCheck(p);
    const nav = await p.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0]; return {dcl:Math.round(n.domContentLoadedEventEnd), load:Math.round(n.loadEventEnd), ttfb:Math.round(n.responseStart)}});
    const key=`${r}@${vp}`; res[key]={loadMs:tl, idleMs:tn, nav, ov:{x:ov.overflowX,sw:ov.scrollWidth,off:ov.offenders.slice(0,3)}, gap:bc.gap, docH:bc.docH, atBottom:bc.atBottom};
    console.log(key, JSON.stringify(res[key]).slice(0,230));
    await p.evaluate(()=>scrollTo(0,0));
    if (vp!=="1280x800") await p.screenshot({path:`${c.SHOTS}/large-${c.slug(r)}__${vp}__light__${vp==="375x812"?"full":"vp"}.png`, fullPage: vp==="375x812"});
  }
  if (vp==="320x640") {
    // monthly cadence + 99.999.999
    await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500);
    await p.getByRole("button",{name:/Bulanan/}).click(); await c.sleep(1200);
    await p.screenshot({path:`${c.SHOTS}/large-home-monthly__320x640__light__vp.png`});
    const txt = await p.evaluate(()=>document.body.innerText);
    res.homeMonthlyHas99 = /99\.999\.999/.test(txt);
    // search
    await p.getByRole("button",{name:"Cari pengeluaran"}).click(); await c.sleep(600);
    await p.keyboard.type("99999999"); await c.sleep(1200);
    await p.screenshot({path:`${c.SHOTS}/large-search__320x640__light__vp.png`});
    res.search = await p.evaluate(()=>({ov:document.documentElement.scrollWidth>innerWidth+1, text:document.body.innerText.slice(0,600)}));
    // find 99.999.999 element and check clipping
    res.big = await p.evaluate(()=>{const els=[...document.querySelectorAll("*")].filter(e=>e.children.length===0&&/99\.999\.999/.test(e.textContent)); return els.slice(0,3).map(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {t:e.textContent.trim().slice(0,30),left:Math.round(r.left),right:Math.round(r.right),sw:e.scrollWidth,cw:e.clientWidth,ellipsis:s.textOverflow,overflow:s.overflow,ws:s.whiteSpace}})});
  }
  if (vp==="375x812") {
    // archive expand all
    await p.goto(c.BASE+"/archive"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(600);
    const before = await p.evaluate(()=>document.documentElement.scrollHeight);
    const btns = p.locator("main button[aria-expanded='false']"); const n = await btns.count();
    const t0=Date.now(); for (let i=0;i<n;i++){ await btns.nth(0).click().catch(()=>{}); }
    await c.sleep(800);
    res.archive = {weekButtons:n, heightBefore:before, heightAfter:await p.evaluate(()=>document.documentElement.scrollHeight), expandMs:Date.now()-t0, domNodes:await p.evaluate(()=>document.querySelectorAll("*").length), ov:(await c.overflow(p)).overflowX};
    console.log("archive", JSON.stringify(res.archive));
    await p.screenshot({path:`${c.SHOTS}/large-archive-expanded__375x812__light__vp.png`});
  }
  await ctx.close();
}
c.save("large.json",res); await b.close();
