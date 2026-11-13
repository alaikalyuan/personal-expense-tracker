import * as c from "./agent-C-common.mjs";
const b = await c.launch(); await c.stateFor(b,"typical");
for (const vp of ["320x640","375x812","430x932"]) {
 const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", vp, "light"); const p = await ctx.newPage();
 await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(600);
 console.log(vp, JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("nav a, nav button")].map(e=>{const s=[...e.querySelectorAll("span")].find(x=>x.innerText);const r=e.getBoundingClientRect();return {t:(s?s.innerText:e.innerText).trim(), w:Math.round(r.width), h:Math.round(r.height), trunc:s?s.scrollWidth>s.clientWidth+1:null, ell:s?getComputedStyle(s).textOverflow:null}}))));
 // streak / header at 320
 console.log(vp,"header", JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("header *, main > div:first-child *")].filter(e=>e.children.length===0&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim().slice(0,30)))));
 await ctx.close();
}
await b.close();
