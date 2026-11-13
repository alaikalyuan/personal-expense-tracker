import * as c from "./agent-C-common.mjs";
import { readFileSync } from "node:fs";
const wallet = JSON.parse(readFileSync(c.DATA+"/wallets.json"))[0];
const b = await c.launch(); const res={};
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", "light");
const p = await ctx.newPage();
for (const r of ["/","/savings","/saku",wallet,"/subscriptions","/split","/split/new","/split/"+c.SPLIT_ID,"/compare","/archive"]) {
  await p.goto(c.BASE+r); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(600);
  res[r.replace(wallet,"/saku/WALLET")] = await p.evaluate(()=>{const m={};let n=0;for(const e of document.querySelectorAll("body *")){const r=e.getBoundingClientRect();if(!r.width)continue;const s=getComputedStyle(e).boxShadow;if(s&&s!=="none"){const vis=s.split(/rgba?\([^)]*\)|oklab\([^)]*\)/).length; const nz=/ (-?[1-9][0-9.]*)px/.test(s.replace(/0px/g,"")) ; if(nz){n++;const k=s.replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px,? ?/g,"").slice(0,50);m[k]=(m[k]||0)+1}}} const flt=[...document.querySelectorAll("body *")].filter(e=>getComputedStyle(e).filter!=="none").length; return {withShadow:n,distinct:m,filtered:flt}});
  console.log(r.slice(0,22), JSON.stringify(res[r.replace(wallet,"/saku/WALLET")]).slice(0,260));
}
c.save("shadows.json",res);
await ctx.close();
// palettes on home
for (const pal of ["pink","blue","mono","hybrid","orange"]) for (const th of ["light","dark"]) {
  const cx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", th, { cookies:[{name:"PALETTE",value:pal,url:c.BASE}] });
  const pg = await cx.newPage(); await pg.goto(c.BASE+"/"); await pg.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(900);
  await pg.screenshot({path:`${c.SHOTS}/home__375x812__${th}__palette-${pal}.png`});
  const col = await pg.evaluate(()=>{const g=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim(); const add=document.querySelector('button[aria-label="Tambah pengeluaran"]'); return {accent:g("--color-accent"), addBg:add&&getComputedStyle(add).backgroundColor, bodyBg:getComputedStyle(document.body).backgroundColor}});
  console.log(pal,th,JSON.stringify(col));
  await cx.close();
}
await b.close();
