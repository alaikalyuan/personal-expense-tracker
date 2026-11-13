import * as c from "./agent-C-common.mjs";
import { readFileSync } from "node:fs";
const wallet = JSON.parse(readFileSync(c.DATA+"/wallets.json"))[0];
const R = [["/","in"],["/?auth=login","out"],["/","out"],["/savings","in"],["/saku","in"],[wallet,"in"],["/subscriptions","in"],["/split","in"],["/split/new","in"],["/split/"+c.SPLIT_ID,"in"],["/split/"+c.SPLIT_ID,"out"],["/compare","in"],["/archive","in"],["/does-not-exist","in"]];
const theme = process.argv[2] || "light";
const b = await c.launch();
const collect = () => {
  const tally = (m,k)=>{m[k]=(m[k]||0)+1};
  const T={color:{},bg:{},radius:{},font:{},size:{},weight:{},shadow:{},blur:{},grad:{}}; const small=[], ex={};
  const vis = e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none"&&s.opacity!=="0"};
  for (const e of document.querySelectorAll("body *")) {
    if(!vis(e)) continue; const s=getComputedStyle(e);
    const ownText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if(ownText){ tally(T.color,s.color); tally(T.font,s.fontFamily.split(",")[0].replace(/"/g,"")); tally(T.size,s.fontSize); tally(T.weight,s.fontWeight);
      if(parseFloat(s.fontSize)<12) small.push(s.fontSize+" "+(e.innerText||"").trim().slice(0,30)); }
    if(s.backgroundColor!=="rgba(0, 0, 0, 0)") tally(T.bg,s.backgroundColor);
    if(s.borderRadius!=="0px"){ tally(T.radius,s.borderRadius); const k=s.borderRadius; (ex["r"+k]=ex["r"+k]||[]).length<2&&ex["r"+k].push(e.tagName.toLowerCase()+"."+String(e.className).slice(0,50)); }
    if(s.boxShadow!=="none"){ tally(T.shadow,s.boxShadow.slice(0,60)); (ex.shadow=ex.shadow||[]).length<3&&ex.shadow.push(e.tagName.toLowerCase()+"."+String(e.className).slice(0,50)); }
    const bf=s.backdropFilter; if(bf&&bf!=="none"){ tally(T.blur,bf); (ex.blur=ex.blur||[]).length<3&&ex.blur.push(String(e.className).slice(0,50)); }
    if(/gradient/.test(s.backgroundImage)){ tally(T.grad,s.backgroundImage.slice(0,70)); (ex.grad=ex.grad||[]).length<3&&ex.grad.push(e.tagName.toLowerCase()+"."+String(e.className).slice(0,50)); }
  }
  return {T,small,ex};
};
const out = {};
for (const vp of ["375x812"]) {
 for (const auth of ["in","out"]) {
  const ctx = await c.ctxWith(b, auth==="in"? c.DATA+"/state-typical.json":null, vp, theme);
  const p = await ctx.newPage();
  for (const [route,a] of R.filter(x=>x[1]===auth)) {
    await p.goto(c.BASE+route); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(800);
    const k=(a==="out"?"OUT ":"")+route.replace(wallet,"/saku/WALLET");
    out[k]=await p.evaluate(collect);
    out[k].text = await p.evaluate(()=>document.body.innerText);
    console.log(k, "colors",Object.keys(out[k].T.color).length,"bg",Object.keys(out[k].T.bg).length,"radius",Object.keys(out[k].T.radius).join("|"),"small",out[k].small.length,"shadow",Object.keys(out[k].T.shadow).length,"blur",Object.keys(out[k].T.blur).length,"grad",Object.keys(out[k].T.grad).length);
  }
  await ctx.close();
 }
}
c.save(`style-${theme}.json`,out);
await b.close();
