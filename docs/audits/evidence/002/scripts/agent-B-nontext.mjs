import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch();
const MEAS = (sels) => {
  const cv=document.createElement("canvas");cv.width=cv.height=1;const cx=cv.getContext("2d",{willReadFrequently:true});
  const rgba=(c)=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);const p=cx.getImageData(0,0,1,1).data;return [p[0],p[1],p[2],p[3]/255];};
  const over=(t,b2)=>{const a=t[3]+b2[3]*(1-t[3]);return [0,1,2].map(i=>(t[i]*t[3]+b2[i]*b2[3]*(1-t[3]))/a).concat([a]);};
  const lum=(c)=>{const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
  const ratio=(a,b2)=>{const l1=lum(a),l2=lum(b2);return +((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)).toFixed(2)};
  const bgOf=(el)=>{const layers=[];let e=el;while(e&&e.nodeType===1){const c=rgba(getComputedStyle(e).backgroundColor);if(c[3]>0)layers.push(c);if(c[3]>=1)break;e=e.parentElement;}let bg=[255,255,255,1];if(!layers.length||layers[layers.length-1][3]<1){const dark=getComputedStyle(document.documentElement).colorScheme.includes("dark");bg=dark?[24,24,27,1]:[255,255,255,1];}for(const l of layers.reverse())bg=over(l,bg);return bg;};
  const out=[];
  for(const [label,sel] of sels){const el=document.querySelector(sel);if(!el){out.push({label,missing:true});continue;}const cs=getComputedStyle(el);const parentBg=bgOf(el.parentElement||el);const own=bgOf(el);
    const bc=rgba(cs.borderTopColor);const bw=parseFloat(cs.borderTopWidth);
    out.push({label,borderW:bw,borderVsParent:bw>0&&bc[3]>0?ratio(over(bc,parentBg),parentBg):null,ownBgVsParent:ratio(own,parentBg),own:own.slice(0,3).map(Math.round).join(","),parent:parentBg.slice(0,3).map(Math.round).join(",")});}
  return out;
};
for (const theme of ["light","dark"]) {
  const ctx = await newContext(b,{theme,hasTouch:true,isMobile:true}); const page=await ctx.newPage(); await login(page,"typical");
  await page.goto(BASE+"/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(600);
  console.log("##",theme,"dashboard");
  console.log(JSON.stringify(await page.evaluate(MEAS,[["search btn","button[aria-label='Cari pengeluaran']"],["cadence pressed","button[aria-pressed=true]"],["cadence unpressed","button[aria-pressed=false]"],["progressbar track","[role=progressbar]"],["progress fill","[role=progressbar] > *"],["row button","ul button"]])));
  // focus ring colour vs page bg
  const ring = await page.evaluate(()=>{const cv=document.createElement("canvas");cv.width=cv.height=1;const cx=cv.getContext("2d");const rg=(c)=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);return [...cx.getImageData(0,0,1,1).data]};const lum=(c)=>{const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};const acc=rg(getComputedStyle(document.documentElement).getPropertyValue("--accent")||"#000");const bg=rg(getComputedStyle(document.body).backgroundColor);const card=rg(getComputedStyle(document.querySelector("ul button")||document.body).backgroundColor);const r=(a,b)=>+((Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)).toFixed(2);return {accent:acc.slice(0,3),vsBody:r(acc,bg),vsCard:r(acc,card)}});
  console.log("focus ring (--accent) contrast:",JSON.stringify(ring));
  await page.getByRole("button",{name:"Tambah pengeluaran"}).click(); await page.waitForTimeout(700);
  await page.getByRole("button",{name:"Standar",exact:true}).click(); await page.waitForTimeout(500);
  console.log("##",theme,"add-standard");
  console.log(JSON.stringify(await page.evaluate(MEAS,[["amount input","[role=dialog] input[placeholder='0']"],["name input","[role=dialog] input[placeholder='Nama pengeluaran']"],["category btn","[role=dialog] button:has(+ button)"]])));
  console.log("selected-state attrs in add dialog:", JSON.stringify(await page.evaluate(()=>({pressed:document.querySelectorAll("[role=dialog] [aria-pressed]").length,selected:document.querySelectorAll("[role=dialog] [aria-selected]").length,checked:document.querySelectorAll("[role=dialog] [aria-checked]").length,current:document.querySelectorAll("[role=dialog] [aria-current]").length}))));
  await ctx.close();
}
const ctx2 = await newContext(b,{theme:"light"}); const p2=await ctx2.newPage(); const r = await p2.goto(BASE+"/does-not-exist"); console.log("signed-out /does-not-exist status", r.status(), "url", p2.url());
await b.close();
