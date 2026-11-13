import { launch, newContext, login, shot, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
await page.goto(BASE + "/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
const snap = await page.locator("body").ariaSnapshot();
writeFileSync(OUT + "/B-aria-dashboard.txt", snap);
console.log(snap.slice(0, 5000));
console.log("---- controls html");
console.log(await page.evaluate(() => {
  const pick = (sel) => [...document.querySelectorAll(sel)].slice(0, 6).map((e) => e.outerHTML.replace(/<svg.*?<\/svg>/gs, "<svg/>").slice(0, 330)).join("\n");
  return "CADENCE:\n" + pick("button[aria-pressed], [role=group] button") + "\nTABLIST:\n" + pick("[role=tablist],[role=tab]") + "\nSEARCH:\n" + pick('button[aria-label="Cari pengeluaran"]') + "\nBREAKDOWN toggle:\n" + pick("button[aria-expanded]") + "\n\nlive: " + [...document.querySelectorAll("[role=status],[role=alert],[aria-live]")].map((e) => e.outerHTML.slice(0, 120)).join("|");
}));
await b.close();
