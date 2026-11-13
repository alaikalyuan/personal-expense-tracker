import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, {});
const page = await ctx.newPage();
const ck = async (l) => console.log(l, "| auth cookie:", (await ctx.cookies()).filter(k=>k.name.includes("auth")).length, "| dialog:", await page.locator('[role=dialog]').count());
await page.goto(BASE); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
const open = async()=>{await page.getByText("Masuk atau Daftar").click(); await page.waitForTimeout(700);};
await open(); await ck("opened");
console.log("active element:", await page.evaluate(()=>document.activeElement.tagName+':'+(document.activeElement.getAttribute('type')||'')+':'+document.activeElement.innerText.slice(0,20)));
await page.keyboard.press("Escape"); await page.waitForTimeout(600); await ck("Escape in dialog");
if(await page.locator('[role=dialog]').count()==0) await open();
await page.getByRole('button',{name:'Tutup'}).click(); await page.waitForTimeout(600); await ck("Tutup");
await open(); await page.getByRole('button',{name:'Batal'}).click(); await page.waitForTimeout(600); await ck("Batal");
console.log("focus after close:", await page.evaluate(()=>document.activeElement.tagName+':'+document.activeElement.innerText.slice(0,30)));
await open(); await page.mouse.click(5,5); await page.waitForTimeout(600); await ck("backdrop on dialog");
// URL ?auth=login
await page.goto(BASE+"/?auth=login"); await page.waitForTimeout(1500); await ck("?auth=login");
await shot(page,"D","A05-auth-login-param");
console.log(await page.evaluate(()=>document.body.innerText.slice(0,400)));
// routes signed-out
for (const r of ["/split/new","/savings","/subscriptions","/archive","/compare","/split","/saku"]) { const resp = await page.goto(BASE+r); await page.waitForTimeout(800); console.log(r, "->", page.url(), resp.status(), (await page.evaluate(()=>document.body.innerText.slice(0,60).replace(/\n/g,' | ')))); }
await ck("end");
await b.close();
