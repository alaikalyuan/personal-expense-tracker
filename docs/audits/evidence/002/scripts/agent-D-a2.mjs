import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, {});
const page = await ctx.newPage();
const ck = async (l) => console.log(l, "| auth cookie count:", (await ctx.cookies()).filter(k=>k.name.includes("auth")).length, "| url:", page.url());
await page.goto(BASE); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
console.log(JSON.stringify(await page.evaluate(()=>({sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight, structure:(function f(e,d){if(d>3)return '';return e.tagName+'.'+String(e.className).slice(0,70)+'['+getComputedStyle(e).position+'/'+getComputedStyle(e).overflowY+' '+e.scrollHeight+'/'+e.clientHeight+']\n'+[...e.children].slice(0,4).map(c=>'  '.repeat(d+1)+f(c,d+1)).join('')})(document.body,0)}))));
// stray: click backdrop-ish areas
await page.mouse.click(5,5); await page.waitForTimeout(800); await ck("click top-left");
await page.mouse.click(370,400); await page.waitForTimeout(800); await ck("click right edge");
await page.keyboard.press("Escape"); await page.waitForTimeout(800); await ck("Escape");
await page.mouse.dblclick(200,100); await page.waitForTimeout(800); await ck("dblclick header");
await page.mouse.click(200,400); await page.waitForTimeout(800); await ck("click on risk card");
await page.mouse.wheel(0,600); await page.waitForTimeout(500);
await shot(page,"D","A02-scrolled");
await ck("scroll");
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].map(e=>e.innerText.trim()+'@'+Math.round(e.getBoundingClientRect().y))));
// Open login
await page.getByText("Masuk atau Daftar").click(); await page.waitForTimeout(1000);
await ck("after Masuk atau Daftar"); await shot(page,"D","A03-login-dialog");
console.log(await page.evaluate(()=>document.body.innerText.slice(0,800)));
console.log(await page.evaluate(()=>{const d=document.querySelector('[role=dialog]');return d?'dialog role present aria-modal='+d.getAttribute('aria-modal'):'no dialog role'}));
console.log(await page.evaluate(()=>[...document.querySelectorAll('button,a')].map(e=>e.innerText.trim()+'|'+(e.getAttribute('aria-label')||'')+'@'+Math.round(e.getBoundingClientRect().y)+'h'+Math.round(e.getBoundingClientRect().height))));
// click backdrop on login
await page.mouse.click(5,5); await page.waitForTimeout(800); await ck("login: backdrop click");
await shot(page,"D","A04-after-login-backdrop");
console.log(await page.evaluate(()=>document.body.innerText.slice(0,300)));
await page.keyboard.press("Escape"); await page.waitForTimeout(800); await ck("login: Escape");
console.log(await page.evaluate(()=>document.body.innerText.slice(0,200)));
await b.close();
