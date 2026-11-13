import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch:true, isMobile:true });
const page = await ctx.newPage();
await login(page, "typical");
const dump = async (url)=>{ await page.goto(BASE+url); await page.waitForLoadState("networkidle"); console.log("== "+url+"\n"+(await page.evaluate(() => [...document.querySelectorAll('a[href],button,input,select,textarea,[role=tab],summary')].filter(e=>e.getBoundingClientRect().width>0 && !e.closest('nav[aria-label]')).map(e=>`${e.tagName.toLowerCase()}|${e.type||''}|name=${(e.getAttribute('aria-label')||e.innerText||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,40)}|href=${e.getAttribute('href')||''}`).join("\n")))); };
for (const u of ["/savings","/saku","/subscriptions","/split/49b6b834-5267-4822-82bb-f654d1045ee3","/archive"]) await dump(u);
await b.close();
