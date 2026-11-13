import * as c from "./agent-C-common.mjs";
const b = await c.launch();
const ctx = await c.ctxWith(b, c.DATA+"/state-large.json", "320x640", "light");
const p = await ctx.newPage(); const res={};
await p.goto(c.BASE+"/archive"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(600);
const btns = p.locator("main button[aria-expanded='false']"); const n = await btns.count();
for (let i=0;i<n;i++) await btns.nth(0).click().catch(()=>{});
await c.sleep(600);
const f = await p.evaluate(()=>{const els=[...document.querySelectorAll("*")].filter(e=>e.children.length===0&&/99\.999\.999/.test(e.textContent)); return els.slice(0,3).map(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);const par=e.closest("li,div[class*=flex]");const name=(par&&par.innerText||"").slice(0,120).replace(/\n/g," | ");return {t:e.textContent.trim().slice(0,30),left:Math.round(r.left),right:Math.round(r.right),sw:e.scrollWidth,cw:e.clientWidth,ellipsis:s.textOverflow,ws:s.whiteSpace,row:name}})});
res.archive=f; console.log(JSON.stringify(f));
if (f.length){ const el = p.locator("text=/99\.999\.999/").first(); await el.scrollIntoViewIfNeeded(); await c.sleep(300); await p.screenshot({path:`${c.SHOTS}/large-bigamount-archive__320x640__light__vp.png`}); }
// home search
await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500);
await p.getByRole("button",{name:"Cari pengeluaran"}).click(); await c.sleep(500);
const inp = p.locator('input[placeholder^="Cari"]').first(); await inp.fill("langganan software"); await c.sleep(1200);
res.searchRows = await p.evaluate(()=>[...document.querySelectorAll("main li, main [role=listitem]")].length);
await inp.scrollIntoViewIfNeeded(); await p.screenshot({path:`${c.SHOTS}/large-search-results__320x640__light__vp.png`});
res.searchOv = (await c.overflow(p)).overflowX;
// long-name wrapping in list: widest elements / clipped text
res.clipped = await p.evaluate(()=>[...document.querySelectorAll("main *")].filter(e=>e.children.length===0&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).textOverflow==="ellipsis").slice(0,6).map(e=>e.textContent.trim().slice(0,40)));
c.save("big.json",res); console.log(JSON.stringify(res).slice(0,800));
await b.close();
