import * as c from "./agent-C-common.mjs";
const b = await c.launch();
const out = [];
async function measure(p, label, vpname, theme="light") {
  await p.waitForSelector("[role=dialog]",{timeout:4000}).catch(()=>{}); const dlg = p.locator("[role=dialog]").last();
  if (!(await dlg.count())) { out.push({label, vpname, error:"no dialog found"}); console.log(label, vpname, "NO DIALOG"); return; }
  await c.sleep(500);
  const m = await p.evaluate(async () => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const d = [...document.querySelectorAll('[role="dialog"]')].pop();
    const r = d.getBoundingClientRect();
    // find scroll containers inside / including dialog
    const scs = [d, ...d.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1;});
    const btns = [...d.querySelectorAll("button, a[href], input, select, textarea")].filter(e=>e.getBoundingClientRect().width>0);
    const submit = btns.filter(e=>e.tagName==="BUTTON"&&(e.type==="submit"||/simpan|tambah|catat|kirim|buat|masuk|ekspor|unduh|salin|bagikan|selesai/i.test(e.innerText)));
    const primary = submit[submit.length-1] || btns.filter(e=>e.tagName==="BUTTON").pop();
    const closeBtn = btns.find(e=>/tutup|close|batal/i.test((e.getAttribute("aria-label")||"")+e.innerText));
    const inView = (e)=>{ if(!e) return null; const q=e.getBoundingClientRect(); return q.top>=0 && q.bottom<=vh && q.left>=0&&q.right<=vw; };
    const before = { primary: inView(primary), close: inView(closeBtn) };
    // scroll every scroller to bottom
    scs.forEach(s=>s.scrollTop=s.scrollHeight);
    await new Promise(r=>setTimeout(r,200));
    const afterBottom = { primary: inView(primary), close: inView(closeBtn) };
    scs.forEach(s=>s.scrollTop=0);
    await new Promise(r=>setTimeout(r,200));
    const afterTop = { primary: inView(primary), close: inView(closeBtn) };
    return { dlg:{top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),h:Math.round(r.height)}, vh, vw, fitsViewport: r.top>=-1&&r.bottom<=vh+1&&r.left>=-1&&r.right<=vw+1, scrollers: scs.length, scrollerInfo: scs.slice(0,2).map(s=>({sh:s.scrollHeight,ch:s.clientHeight})), pageOverflowX: document.documentElement.scrollWidth>vw+1, primary: primary? (primary.getAttribute("aria-label")||primary.innerText||"").trim().slice(0,24):null, closeLabel: closeBtn? (closeBtn.getAttribute("aria-label")||closeBtn.innerText||"").trim().slice(0,20):null, before, afterBottom, afterTop, bodyLocked: getComputedStyle(document.body).overflow };
  });
  await p.screenshot({ path: `${c.SHOTS}/modal-${label}__${vpname}__${theme}__open.png` });
  out.push({label, vpname, ...m});
  console.log(label, vpname, "fits", m.fitsViewport, "scrollers", m.scrollers, "primary", m.primary, JSON.stringify(m.before.primary), JSON.stringify(m.afterBottom.primary), "close", JSON.stringify(m.afterTop.close));
}
const scenarios = {
  addexp: async (p) => { await p.getByRole("button",{name:"Tambah pengeluaran"}).click(); },
  menu: async (p) => { await p.getByRole("button",{name:"Buka menu"}).click(); },
  budget: async (p) => { await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(400); const cand = p.locator('[role=dialog] button', {hasText:/anggaran|budget|target/i}).first(); if(await cand.count()) await cand.click(); else throw new Error("no budget row in menu"); },
  notif: async (p) => { await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(400); await p.locator('[role=dialog] button',{hasText:/^\s*Notifikasi/}).first().click(); },
  emailsync: async (p) => { await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(400); await p.locator('[role=dialog] button',{hasText:/Sinkron|Email/i}).first().click(); },
  edit: async (p) => { await p.getByRole("button",{name:/^Ubah \[A002\] Nasi padang/}).click(); },
  export: async (p) => { await p.getByRole("button",{name:"Bagikan / Ekspor"}).click(); },
};
const routeFor = { addexp:"/", menu:"/", budget:"/", notif:"/", emailsync:"/", edit:"/", export:"/" };
const extra = {
  goal: ["/savings", async (p)=>{ await p.getByRole("button",{name:"Tambah Target Baru"}).click(); }],
  subadd: ["/subscriptions", async (p)=>{ await p.getByRole("button",{name:"Tambah",exact:true}).click(); }],
  login: ["/?auth=login", async()=>{}],
};
for (const [vpname, vp] of [["375x500",[375,500]],["320x640",[320,640]]]) {
  const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", vp, "light");
  const p = await ctx.newPage();
  for (const [k, fn] of Object.entries(scenarios)) {
    try { await p.goto(c.BASE+routeFor[k]); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500); await fn(p); await measure(p,k,vpname); }
    catch(e){ out.push({label:k,vpname,error:String(e).slice(0,120)}); console.log(k,vpname,"ERR",String(e).slice(0,100)); }
  }
  for (const [k,[route,fn]] of Object.entries(extra)) {
    if (k==="login") continue;
    try { await p.goto(c.BASE+route); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500); await fn(p); await measure(p,k,vpname); }
    catch(e){ out.push({label:k,vpname,error:String(e).slice(0,120)}); console.log(k,vpname,"ERR",String(e).slice(0,100)); }
  }
  await ctx.close();
  const ctx2 = await c.ctxWith(b, null, vp, "light"); const p2 = await ctx2.newPage();
  try { await p2.goto(c.BASE+"/?auth=login"); await c.sleep(1200); await measure(p2,"login",vpname); } catch(e){ out.push({label:"login",vpname,error:String(e).slice(0,100)}); }
  await ctx2.close();
}
c.save("modals.json", out);
await b.close();
