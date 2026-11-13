import { launch, newContext, login, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
await page.goto(BASE + "/archive"); await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: "Buka semua" }).click(); await page.waitForTimeout(500);
for (let i=0;i<60;i++){ await page.keyboard.press("Tab"); const hit = await page.evaluate(()=>{const a=document.activeElement;const r=a.getBoundingClientRect(); if(r.top>=740&&/Laundry|Gojek/.test(a.getAttribute('aria-label')||'')&&r.bottom<=812){const t=document.elementFromPoint(r.left+r.width/2,Math.min(r.top+r.height/2,811)); return {a:a.getAttribute('aria-label'),top:r.top,cover:t.tagName+'.'+String(t.className).slice(0,80),coverFixed:getComputedStyle(t.closest('nav')||t).position};} return null;}); if(hit){console.log(JSON.stringify(hit)); await shot(page,"B","wcag-2411-obscured-focus"); break;} }
await b.close();
