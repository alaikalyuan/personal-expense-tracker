import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b,{hasTouch:true,isMobile:true}); const page = await ctx.newPage(); await login(page,"typical");
console.log("viewport meta:", await (async()=>{await page.goto(BASE+"/"); return page.evaluate(()=>document.querySelector("meta[name=viewport]").content)})());
for (const u of ["/","/savings","/compare","/archive","/subscriptions","/split/49b6b834-5267-4822-82bb-f654d1045ee3"]) { await page.goto(BASE+u); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
 const r = await page.evaluate(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n,tot=0,small=0,tiny=0;const ex=[];while((n=w.nextNode())){if(!n.nodeValue.trim())continue;const e=n.parentElement;if(e.getBoundingClientRect().width<1||e.closest("script,style"))continue;tot++;const s=parseFloat(getComputedStyle(e).fontSize);if(s<12){small++;if(ex.length<3)ex.push(n.nodeValue.trim().slice(0,20)+":"+s)}if(s<11)tiny++;}return {tot,small,tiny,ex}});
 console.log(u.slice(0,20), JSON.stringify(r)); }
// savings history delete visible without hover?
await page.goto(BASE+"/savings"); await page.waitForLoadState("networkidle");
console.log("history delete buttons:", JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>b.innerText.trim()==="Hapus").map(b=>({op:getComputedStyle(b).opacity,w:Math.round(b.getBoundingClientRect().width),vis:getComputedStyle(b).visibility})))));
await b.close();
