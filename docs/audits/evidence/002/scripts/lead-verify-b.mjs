import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch();
// 1. login dialog names (signed out)
{ const ctx = await newContext(b); const p = await ctx.newPage(); await p.goto(BASE + "/?auth=login"); await p.waitForTimeout(1200);
  const snap = await p.locator('[role=dialog]').first().ariaSnapshot().catch(e => "ERR " + e.message);
  console.log("LOGIN ariaSnapshot:\n" + snap.split("\n").filter(l => /textbox|button/.test(l)).join("\n")); await ctx.close(); }
const ctx = await newContext(b); const p = await ctx.newPage(); await login(p, "typical");
// 2. AI sheet focus
await p.goto(BASE + "/"); await p.waitForTimeout(1000);
const aiBtn = p.getByRole("button", { name: /asisten|AI|tanya/i }).first();
console.log("AI button:", await aiBtn.getAttribute("aria-label"));
await aiBtn.click(); await p.waitForTimeout(1500);
const inSheet = async () => p.evaluate(() => { const d = document.querySelector('[role=dialog]'); return { active: document.activeElement?.tagName + "|" + (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim().slice(0, 30), inside: !!(d && d.contains(document.activeElement)) }; });
console.log("AI after open:", JSON.stringify(await inSheet()));
let out = 0; for (let i = 0; i < 30; i++) { await p.keyboard.press("Tab"); if (!(await inSheet()).inside) out++; }
console.log("AI Tab presses landing outside sheet:", out, "/30");
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
// 3. QR dialog Escape on split viewer
await p.goto(BASE + "/split/49b6b834-5267-4822-82bb-f654d1045ee3"); await p.waitForTimeout(1500);
const qr = p.getByRole("button", { name: /QR/i }).first();
if (await qr.count()) { await qr.click(); await p.waitForTimeout(800);
  console.log("QR dialogs open:", await p.locator('[role=dialog]').count());
  await p.keyboard.press("Escape"); await p.waitForTimeout(800);
  console.log("QR dialogs after Escape:", await p.locator('[role=dialog]').count()); } else console.log("no QR button found");
// 4. focus obscured by bottom nav on /
await p.goto(BASE + "/"); await p.waitForTimeout(1200);
const res = []; for (let i = 0; i < 40; i++) { await p.keyboard.press("Tab");
  res.push(await p.evaluate(() => { const a = document.activeElement; const nav = document.querySelector("nav"); if (!a || !nav) return null; const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect(); if (nav.contains(a)) return null; const covered = r.top >= n.top - 1 && r.bottom <= window.innerHeight + 1; return covered ? (a.textContent || "").trim().slice(0, 30) + ` top=${Math.round(r.top)} navTop=${Math.round(n.top)}` : null; })); }
console.log("Focused elements fully within bottom-nav band:", res.filter(Boolean));
console.log("titles:", await (async () => { const t = []; for (const r of ["/", "/savings", "/compare", "/split", "/subscriptions"]) { await p.goto(BASE + r); t.push(r + " => " + await p.title()); } return t.join(" | "); })());
await b.close();
