import { launch, newContext, login, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b,{theme:"light",hasTouch:true,isMobile:true}); const page = await ctx.newPage(); await login(page,"typical");
page.on("dialog", d=>d.dismiss());
const act = () => page.evaluate(() => { const a = document.activeElement; return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label")||a.innerText||a.placeholder||"").trim().replace(/\s+/g," ").slice(0,32)}" exp=${a.getAttribute("aria-expanded")} pressed=${a.getAttribute("aria-pressed")}`; });
const focusBy = async (name) => { const l = page.getByRole("button",{name}).first(); await l.focus(); };
await page.goto(BASE+"/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(600);
// skip link?
console.log("skip link present:", await page.evaluate(()=>!![...document.querySelectorAll("a")].find(a=>/skip|lewati/i.test(a.innerText))));
// 1 cadence
await focusBy("Bulanan"); await page.keyboard.press("Space"); await page.waitForTimeout(600); console.log("cadence after Space:", await act(), "| other pressed:", await page.getByRole("button",{name:"Mingguan"}).getAttribute("aria-pressed"));
await focusBy("Mingguan"); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
// 2 search disclosure
await focusBy("Cari pengeluaran"); await page.keyboard.press("Enter"); await page.waitForTimeout(500); console.log("search after Enter:", await act(), "| focus now:", await act());
console.log("search input exists:", await page.evaluate(()=>{const i=document.querySelector("input[type=search],input[placeholder*='Cari']");return i?{ph:i.placeholder,label:i.getAttribute("aria-label"),labels:[...(i.labels||[])].map(l=>l.innerText),type:i.type}:null}));
await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log("after Esc on search:", await act());
// 3 saku switcher
await focusBy(/Semua Saku/); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("saku switcher open:", await page.evaluate(()=>{const b=document.querySelector("[aria-haspopup]");const m=b.parentElement.querySelector("[role=menu],[role=listbox],ul");return {exp:b.getAttribute("aria-expanded"),popup:b.getAttribute("aria-haspopup"),menuRole:m&&m.getAttribute("role"),items:[...(m?m.querySelectorAll("[role=menuitem],[role=option],button"):[])].map(e=>e.getAttribute("role")+":"+e.innerText.trim().slice(0,20))}}), "| active:", await act());
await page.keyboard.press("ArrowDown"); console.log("after ArrowDown:", await act()); await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log("after Esc:", await act(), "| expanded:", await page.evaluate(()=>document.querySelector("[aria-haspopup]").getAttribute("aria-expanded")));
// 4 Rincian disclosure
await focusBy(/Rincian minggu ini/); await page.keyboard.press("Enter"); await page.waitForTimeout(500); console.log("Rincian after Enter:", await act());
await page.keyboard.press("Enter"); await page.waitForTimeout(300);
// 5 menu -> pages
for (const [item, path] of [["Langganan","/subscriptions"],["Arsip","/archive"]]) {
  await page.goto(BASE+"/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(400);
  await focusBy("Buka menu"); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  const link = page.locator("[role=dialog]").getByRole("link",{name:new RegExp(item)}); await link.focus(); await page.keyboard.press("Enter"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(600);
  console.log("menu ->", item, "url", new URL(page.url()).pathname, "| dialogs left:", await page.evaluate(()=>document.querySelectorAll("[role=dialog]").length), "| focus:", await act(), "| title:", await page.title());
}
// bottom nav by keyboard
for (const n of ["Patungan","Saku Saya","Bandingkan","Beranda"]) { await page.goto(BASE+"/"); await page.waitForLoadState("networkidle"); await page.getByRole("link",{name:n}).focus(); await page.keyboard.press("Enter"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500); console.log("nav ->", n, new URL(page.url()).pathname, "aria-current on active link:", await page.evaluate((n)=>{const a=[...document.querySelectorAll("nav a")].find(a=>a.innerText.trim()===n);return a&&a.getAttribute("aria-current")},n)); }
// 6 add dialog: type then Escape
await page.goto(BASE+"/"); await page.waitForLoadState("networkidle");
await focusBy("Tambah pengeluaran"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
await page.keyboard.type("Makan 25k"); await page.waitForTimeout(400);
console.log("typed; preview present:", await page.evaluate(()=>/Terdeteksi/.test(document.querySelector("[role=dialog]").innerText)), "submit disabled:", await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] button[type=submit]")].map(b=>b.disabled)));
await shot(page,"B","journeyH-add-typed");
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("Escape with typed text -> dialogs:", await page.evaluate(()=>document.querySelectorAll("[role=dialog]").length), "(closed without confirm/draft prompt)", "focus:", await act());
await page.keyboard.press("Escape");
// reopen: draft retained?
await focusBy("Tambah pengeluaran"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
console.log("reopen field value:", JSON.stringify(await page.evaluate(()=>document.querySelector("[role=dialog] input[type=text]")?.value)));
await b.close();
