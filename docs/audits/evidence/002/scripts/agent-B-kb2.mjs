import { launch, newContext, login, shot, BASE, OUT } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
const probe = () => page.evaluate(() => {
  const a = document.activeElement; const r = a.getBoundingClientRect(); const vh = innerHeight;
  const nav = document.querySelector("nav[aria-label]"); const nr = nav.getBoundingClientRect();
  const pts = [[0.5, 0.5], [0.5, 0.1], [0.5, 0.9]].map(([fx, fy]) => { const x = r.left + r.width * fx, y = Math.min(r.top + r.height * fy, vh - 1); const t = document.elementFromPoint(x, y); return t && (a.contains(t) || t.contains(a)) ? 1 : 0; });
  return { name: (a.getAttribute("aria-label") || a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 34), top: Math.round(r.top), bottom: Math.round(r.bottom), navTop: Math.round(nr.top), visibleSamples: pts.join(""), hiddenBehindNav: r.bottom > nr.top && r.top < vh };
});
async function walk(label, url, setup, n) {
  await page.goto(BASE + url); await page.waitForLoadState("networkidle"); await page.waitForTimeout(600);
  if (setup) await setup();
  console.log("== " + label);
  let worst = 0;
  for (let i = 0; i < n; i++) { await page.keyboard.press("Tab"); const p = await probe(); if (p.hiddenBehindNav) { console.log(JSON.stringify(p)); } }
  await shot(page, "B", "kb2-" + label);
}
await walk("dash-week-list", "/", async () => { await page.getByRole("button", { name: /Minggu Ini/ }).click(); await page.waitForTimeout(500); }, 60);
await walk("dash-month", "/", async () => { await page.getByRole("button", { name: "Bulanan" }).click(); await page.waitForTimeout(800); await page.getByRole("button", { name: /Bulan Ini|Minggu Ini/ }).first().click().catch(() => {}); await page.waitForTimeout(500); }, 70);
await walk("archive-open-all", "/archive", async () => { await page.getByRole("button", { name: "Buka semua" }).click(); await page.waitForTimeout(500); }, 50);
await walk("subscriptions", "/subscriptions", null, 40);
await walk("savings", "/savings", null, 50);
await b.close();
