import * as c from "./agent-C-common.mjs";
const b = await c.launch();
const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", [375,500], "light");
const p = await ctx.newPage();
await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle"); await c.sleep(500);
await p.getByRole("button",{name:"Buka menu"}).click(); await c.sleep(400);
await p.locator('[role=dialog] button',{hasText:/Sinkron|Email/i}).first().click(); await c.sleep(1000);
console.log(JSON.stringify(await p.evaluate(()=>{const d=[...document.querySelectorAll("[role=dialog]")].pop(); const out=[]; let e=d; const chain=[]; for(const x of [d,...d.querySelectorAll("*")]){ if(x.scrollHeight>x.clientHeight+2){const s=getComputedStyle(x); out.push(x.tagName+"."+String(x.className).slice(0,50)+" sh="+x.scrollHeight+" ch="+x.clientHeight+" ovY="+s.overflowY);} } const bs=[...d.querySelectorAll("button")].map(x=>{const r=x.getBoundingClientRect();return (x.innerText||x.getAttribute("aria-label")||"").trim().slice(0,20)+"@"+Math.round(r.top)+"-"+Math.round(r.bottom)}); const body=getComputedStyle(document.body).overflow; return {out,bs,body,vh:innerHeight}})));
// keyboard: tab through to last focusable and see where it is
for (let i=0;i<14;i++) await p.keyboard.press("Tab");
console.log(JSON.stringify(await p.evaluate(()=>{const a=document.activeElement; const r=a.getBoundingClientRect(); return {tag:a.tagName, t:(a.innerText||"").slice(0,20), top:Math.round(r.top), bottom:Math.round(r.bottom), vh:innerHeight}})));
await p.screenshot({path:`${c.SHOTS}/modal-emailsync__375x500__light__tabbed.png`});
await b.close();
