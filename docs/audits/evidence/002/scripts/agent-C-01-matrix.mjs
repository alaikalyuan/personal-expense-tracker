import * as c from "./agent-C-common.mjs";
import { readFileSync } from "node:fs";
const wallet = JSON.parse(readFileSync(c.DATA+"/wallets.json"))[0];
const R = [
 ["/", "out"], ["/?auth=login","out"], ["/","in"], ["/savings","in"], ["/saku","in"], [wallet,"in"], ["/subscriptions","in"], ["/split","in"], ["/split/new","in"], ["/split/"+c.SPLIT_ID,"in"], ["/split/"+c.SPLIT_ID,"out"], ["/compare","in"], ["/archive","in"], ["/does-not-exist","in"], ["/does-not-exist","out"]
];
const themes = process.argv[2]==="dark" ? ["dark"] : ["light"];
const vps = process.argv[3] ? process.argv[3].split(",") : Object.keys(c.VPS);
const b = await c.launch();
const results = [];
for (const theme of themes) for (const vp of vps) {
  for (const auth of ["in","out"]) {
    const ctx = await c.ctxWith(b, auth==="in"? c.DATA+"/state-typical.json": null, vp, theme);
    const page = await ctx.newPage();
    for (const [route, a] of R.filter(x=>x[1]===auth)) {
      const t0 = Date.now();
      try {
        await page.goto(c.BASE+route, { waitUntil:"load", timeout:30000 });
        await page.waitForLoadState("networkidle", {timeout:8000}).catch(()=>{});
        await c.sleep(700);
      } catch(e){ results.push({route,auth,vp,theme,error:String(e).slice(0,100)}); continue; }
      const ms = Date.now()-t0;
      const rname = c.slug(route.replace(wallet,"/saku/WALLET"))+(auth==="out"?"-out":"");
      const ov = await c.overflow(page);
      const full = vp==="375x812"||vp==="1280x800"||vp==="320x640";
      let shotName = `${rname}__${vp}__${theme}__${full?"full":"vp"}`;
      await page.screenshot({ path: `${c.SHOTS}/${shotName}.png`, fullPage: full });
      const bc = await c.bottomCheck(page);
      if (vp==="375x812"||vp==="320x640") await page.screenshot({ path: `${c.SHOTS}/${rname}__${vp}__${theme}__bottom.png` });
      const h1 = await page.evaluate(()=>document.title);
      results.push({ route: route.replace(wallet,"/saku/WALLET"), auth, vp, theme, ms, title:h1, ov: {sw:ov.scrollWidth,vw:ov.viewport,x:ov.overflowX,off:ov.offenders.slice(0,4)}, bc });
      console.log(theme, vp, auth, route.slice(0,20), ov.overflowX?"OVERFLOW":"ok", "gap", bc.gap, bc.lastEl.slice(0,20));
    }
    await ctx.close();
  }
}
c.save(`matrix-${themes[0]}${process.argv[3]?"-"+process.argv[3].replace(/,/g,"_"):""}.json`, results);
await b.close();
