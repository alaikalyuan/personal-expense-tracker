import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, {});
const page = await ctx.newPage();
const cookies = async (l) => console.log(l, "authcookie:", (await ctx.cookies()).filter(k=>k.name.includes("auth-token")).length, "all:", (await ctx.cookies()).map(k=>k.name).join(","));
await page.goto(BASE); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
await cookies("initial");
await shot(page,"D","A01-initial");
console.log(await page.evaluate(()=>document.body.innerText));
// dialog info
console.log(await page.evaluate(()=>{const d=document.querySelector('[role=dialog]');return d?d.outerHTML.slice(0,3000):'no dialog role'}));
// scroll boxes
console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+2 && ['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,80),sh:e.scrollHeight,ch:e.clientHeight})))));
console.log(JSON.stringify(await page.evaluate(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return {nav:q('nav'), btns:[...document.querySelectorAll('button,a')].map(e=>({t:e.innerText.trim().slice(0,30),y:Math.round(e.getBoundingClientRect().y),h:Math.round(e.getBoundingClientRect().height)}))}})));
await b.close();
