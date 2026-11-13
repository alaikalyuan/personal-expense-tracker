import * as c from "./agent-C-common.mjs";
const b = await c.launch(); await c.stateFor(b,"typical");
for (const vp of ["320x640","375x812"]) {
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", vp, "light"); const p = await ctx.newPage();
await p.goto(c.BASE+"/split/new"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(800);
console.log(vp, JSON.stringify(await p.evaluate(()=>{const btn=[...document.querySelectorAll("button")].find(x=>/Publikasikan/.test(x.innerText)); const r=btn.getBoundingClientRect(); const bar=btn.parentElement.getBoundingClientRect(); let a=btn.parentElement; const pr=[]; for(let i=0;i<3&&a;i++,a=a.parentElement){const q=a.getBoundingClientRect();pr.push([Math.round(q.left),Math.round(q.right)])} return {btn:[Math.round(r.left),Math.round(r.right)],bar:[Math.round(bar.left),Math.round(bar.right)],ancestors:pr,vw:innerWidth,touchH:Math.round(r.height)}})));
await ctx.close();}
// sub card actions at 320 touch sizes
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "320x640", "light"); const p = await ctx.newPage();
await p.goto(c.BASE+"/subscriptions"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(800);
console.log("subs320", JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("main button")].filter(x=>x.getBoundingClientRect().width>0).map(x=>{const r=x.getBoundingClientRect();return (x.getAttribute("aria-label")||x.innerText||"").trim().slice(0,14)+"["+Math.round(r.left)+"-"+Math.round(r.right)+" y"+Math.round(r.top)+"]"}).filter(s=>true).slice(-12))));
await p.evaluate(()=>scrollTo(0,0)); await p.screenshot({path:`${c.SHOTS}/subscriptions__320x640__light__overflow-vp.png`});
await b.close();
