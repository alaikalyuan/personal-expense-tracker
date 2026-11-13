import * as c from "./agent-C-common.mjs";
const b = await c.launch(); const res = {};
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", [375,500], "light");
const p = await ctx.newPage();
const vis = (sel)=>p.evaluate((sel)=>{const d=[...document.querySelectorAll(sel)].pop(); if(!d) return null; const vh=innerHeight; const sc=[d,...d.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1;}); return {scrollers:sc.map(s=>s.tagName+"."+String(s.className).slice(0,40)+" "+s.scrollHeight+"/"+s.clientHeight), submit:[...d.querySelectorAll("button")].filter(x=>/simpan|catat|tambah|selesai/i.test(x.innerText)).map(x=>{const r=x.getBoundingClientRect();return x.innerText.trim().slice(0,20)+"@"+Math.round(r.top)+"-"+Math.round(r.bottom)})}},sel);
// emailsync scrollers
await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle"); await c.sleep(500);
await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(400);
await p.locator('[role=dialog] button',{hasText:/Sinkron|Email/i}).first().click(); await c.sleep(800);
res.emailsync = await vis("[role=dialog]");
// try wheel scroll inside dialog to see if content moves
const y0 = await p.evaluate(()=>[...document.querySelectorAll("[role=dialog] *")].map(e=>e.scrollTop).reduce((a,b)=>a+b,0));
await p.mouse.move(180,300); await p.mouse.wheel(0,600); await c.sleep(300);
res.emailsyncWheelScrollTopSum = [y0, await p.evaluate(()=>[...document.querySelectorAll("[role=dialog] *")].map(e=>e.scrollTop).reduce((a,b)=>a+b,0))];
await p.screenshot({path:`${c.SHOTS}/modal-emailsync__375x500__light__scrolled.png`});
// add expense modes
await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle"); await c.sleep(500);
await p.getByRole("button",{name:"Tambah pengeluaran"}).click(); await c.sleep(800);
res.addexp_quick = await vis("[role=dialog]");
for (const [name,key] of [["Standar","standar"],["Upload Foto","foto"]]) {
  await p.getByRole("button",{name}).first().click().catch(e=>{res[key+"_err"]=String(e).slice(0,80)}); await c.sleep(800);
  res["addexp_"+key] = await vis("[role=dialog]");
  await p.screenshot({path:`${c.SHOTS}/modal-addexp-${key}__375x500__light__open.png`});
  // scroll dialog to bottom and screenshot
  await p.evaluate(()=>{[...document.querySelectorAll("[role=dialog], [role=dialog] *")].forEach(e=>{if(e.scrollHeight>e.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(e).overflowY)) e.scrollTop=e.scrollHeight})}); await c.sleep(300);
  await p.screenshot({path:`${c.SHOTS}/modal-addexp-${key}__375x500__light__bottom.png`});
  res["addexp_"+key+"_afterBottom"] = await vis("[role=dialog]");
}
// resize while modal open: current add-expense dialog
for (const [n,w,h] of [["1280x800",1280,800],["320x640",320,640],["375x812",375,812]]) {
  await p.setViewportSize({width:w,height:h}); await c.sleep(600);
  const m = await p.evaluate(()=>{const d=[...document.querySelectorAll("[role=dialog]")].pop(); if(!d) return {dialog:false}; const r=d.getBoundingClientRect(); return {dialog:true, l:Math.round(r.left), r:Math.round(r.right), t:Math.round(r.top), b:Math.round(r.bottom), vw:innerWidth, vh:innerHeight, overflowX:document.documentElement.scrollWidth>innerWidth+1}});
  res["resize_addexp_"+n]=m; await p.screenshot({path:`${c.SHOTS}/modal-addexp-resize__${n}__light__open.png`});
}
// account menu open on resize
await p.setViewportSize({width:375,height:812}); await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle"); await c.sleep(500);
await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(500);
for (const [n,w,h] of [["1280x800",1280,800],["320x640",320,640],["375x812",375,812]]) {
  await p.setViewportSize({width:w,height:h}); await c.sleep(600);
  const m = await p.evaluate(()=>{const d=[...document.querySelectorAll("[role=dialog]")].pop(); if(!d) return {dialog:false}; const r=d.getBoundingClientRect(); const act=document.activeElement; return {dialog:true, l:Math.round(r.left), r:Math.round(r.right), t:Math.round(r.top), b:Math.round(r.bottom), vw:innerWidth, vh:innerHeight, focusInside:d.contains(act), overflowX:document.documentElement.scrollWidth>innerWidth+1}});
  res["resize_menu_"+n]=m; await p.screenshot({path:`${c.SHOTS}/modal-menu-resize__${n}__light__open.png`});
}
c.save("modes-resize.json",res); console.log(JSON.stringify(res,null,1));
await b.close();
