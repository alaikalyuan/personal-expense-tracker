import * as c from "./agent-C-common.mjs";
import { readFileSync } from "node:fs";
const wallet = JSON.parse(readFileSync(c.DATA+"/wallets.json"))[0];
const b = await c.launch(); const res={}; await c.stateFor(b,"typical");
for (const theme of ["light","dark"]) {
  const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", theme);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:400,downloadThroughput:100*1024,uploadThroughput:25*1024});
  // client-side navs via bottom nav links (these hit loading.tsx)
  for (const [label,name] of [["split","Patungan"],["saku","Saku Saya"],["compare","Bandingkan"]]) {
    await p.goto(c.BASE+"/",{waitUntil:"commit"}).catch(()=>{}); await p.waitForSelector("nav a",{timeout:30000}).catch(()=>{}); await c.sleep(1500);
    await p.getByRole("link",{name:new RegExp(name)}).click({noWaitAfter:true}).catch(e=>console.log("click err",label));
    await c.sleep(500);
    const info = await p.evaluate(()=>({busy:!!document.querySelector('[aria-busy="true"]'), pulse:!!document.querySelector(".animate-pulse"), main:(document.querySelector("main")||{}).className, path:location.pathname, bg:getComputedStyle(document.body).backgroundColor, skelBg:(()=>{const e=document.querySelector(".animate-pulse div div");return e?getComputedStyle(e).backgroundColor:null})()}));
    res[`${label}-clientnav-${theme}`]=info; console.log(theme,label,JSON.stringify(info));
    await p.screenshot({path:`${c.SHOTS}/loading-${label}-clientnav__375x812__${theme}__skeleton.png`});
  }
  // hard nav with throttling, capture early
  for (const r of ["/savings","/subscriptions","/archive","/split","/compare","/split/"+c.SPLIT_ID]) {
    const nm=c.slug(r.replace(wallet,"/saku/WALLET"));
    const nav = p.goto(c.BASE+r,{waitUntil:"commit"}).catch(()=>{});
    await c.sleep(900);
    const info = await p.evaluate(()=>({busy:!!document.querySelector('[aria-busy="true"]'), label:(document.querySelector('[aria-busy="true"]')||{getAttribute(){}}).getAttribute("aria-label"), text:document.body.innerText.slice(0,50).replace(/\n/g," "), bg:getComputedStyle(document.body).backgroundColor, path:location.pathname}));
    res[`${nm}-hard-${theme}`]=info; console.log(theme,nm,JSON.stringify(info));
    await p.screenshot({path:`${c.SHOTS}/loading-${nm}-hard__375x812__${theme}__early.png`});
    await nav; await p.waitForLoadState("load").catch(()=>{}); await c.sleep(800);
  }
  await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await ctx.close();
}
c.save("loading.json",res); await b.close();
