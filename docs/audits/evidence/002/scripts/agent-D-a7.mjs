import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, {storageState:"../out/_D_guest_state.json"});
const page = await ctx.newPage();
await page.goto(BASE); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(700);
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog] *')].filter(e=>e.children.length==0&&e.innerText&&e.innerText.trim()).map(e=>e.innerText.trim()).slice(-12)));
console.log("has Keluar:", await page.getByText(/Keluar|Sign out/i).count());
await page.keyboard.press("Escape");
for (const r of ["/split/new","/savings","/subscriptions","/archive","/compare","/split"]) { await page.goto(BASE+r); await page.waitForTimeout(1500); console.log(r, "->", page.url(), (await page.evaluate(()=>document.body.innerText.slice(0,260).replace(/\n+/g,' | ')))); }
await shot(page,"D","A12-guest-split");
await b.close();
