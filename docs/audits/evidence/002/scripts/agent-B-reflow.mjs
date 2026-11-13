import { launch, newContext, login, overflow, shot, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const SPLIT = "49b6b834-5267-4822-82bb-f654d1045ee3";
const b = await launch();
const res = [];
const SPACING = `*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}`;
// clipped text detector
const CLIP = () => [...document.querySelectorAll("body *")].filter((e) => { const cs = getComputedStyle(e); if (!e.childNodes.length) return false; const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()); if (!hasText) return false; const r = e.getBoundingClientRect(); if (r.width === 0) return false; return (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.textOverflow === "ellipsis") && (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) && cs.overflowY !== "auto" && cs.overflowY !== "scroll"; }).slice(0, 8).map((e) => `${e.tagName.toLowerCase()}:"${e.innerText.trim().slice(0, 30)}" ${e.scrollWidth}x${e.scrollHeight} in ${e.clientWidth}x${e.clientHeight} ${getComputedStyle(e).textOverflow}`);

async function pageTest(label, page, url, vp) {
  await page.goto(BASE + url); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(600);
  const o = await overflow(page);
  const clipped = await page.evaluate(CLIP);
  const r = { label, url, vp, scrollWidth: o.scrollWidth, viewport: o.viewport, overflowX: o.overflowX, offenders: o.offenders.slice(0, 4), clippedTextCount: clipped.length, clipped: clipped.slice(0, 4) };
  res.push(r); console.log(JSON.stringify(r));
  return r;
}
for (const vp of [{ width: 320, height: 640 }, { width: 640, height: 400 }]) {
  const ctxO = await newContext(b, { viewport: vp, theme: "light", hasTouch: true, isMobile: true }); const po = await ctxO.newPage();
  for (const u of ["/", "/?auth=login", "/split/" + SPLIT, "/does-not-exist"]) await pageTest("out", po, u, vp.width + "x" + vp.height);
  await ctxO.close();
  const ctx = await newContext(b, { viewport: vp, theme: "light", hasTouch: true, isMobile: true }); const page = await ctx.newPage();
  await login(page, "typical");
  await page.goto(BASE + "/saku"); await page.waitForLoadState("networkidle");
  const wid = await page.evaluate(() => [...document.querySelectorAll('a[href^="/saku/"]')].map((a) => a.getAttribute("href"))[0]);
  for (const u of ["/", "/savings", "/saku", wid, "/subscriptions", "/split", "/split/new", "/split/" + SPLIT, "/split/" + SPLIT + "/edit", "/compare", "/archive"]) await pageTest("typical", page, u, vp.width + "x" + vp.height);
  // dialogs at 320x640 / 640x400
  for (const [n, u, fn] of [["add-standard", "/", async () => { await page.getByRole("button", { name: "Tambah pengeluaran" }).click(); await page.waitForTimeout(400); await page.getByRole("button", { name: "Standar", exact: true }).click(); }], ["menu", "/", () => page.getByRole("button", { name: "Buka menu" }).click()], ["savings-goal", "/savings", () => page.getByRole("button", { name: "Tambah Target Baru" }).click()], ["sub-add", "/subscriptions", () => page.getByRole("button", { name: "Tambah", exact: true }).click()]]) {
    await page.goto(BASE + u); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(400); await fn(); await page.waitForTimeout(700);
    const d = await page.evaluate(() => { const d = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop(); const r = d.getBoundingClientRect(); const sc = [...d.querySelectorAll("*")].find((e) => getComputedStyle(e).overflowY === "auto"); const btns = [...d.querySelectorAll("button")].filter((e) => e.getBoundingClientRect().width > 0); const lastBtn = btns[btns.length - 1]; const lr = lastBtn.getBoundingClientRect(); return { dlgRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vh: innerHeight, vw: innerWidth, scrollable: !!sc, scrollH: sc ? sc.scrollHeight : null, clientH: sc ? sc.clientHeight : null, lastBtnBottom: Math.round(lr.bottom), closeReachable: [...d.querySelectorAll("button")].some((e) => /tutup|close/i.test(e.getAttribute("aria-label") || "") && e.getBoundingClientRect().top >= 0), pageOverflowX: document.documentElement.scrollWidth > innerWidth + 1 }; });
    console.log("DLG", n, vp.width + "x" + vp.height, JSON.stringify(d)); res.push({ dlg: n, vp: vp.width + "x" + vp.height, ...d });
    await shot(page, "B", `reflow-dlg-${n}-${vp.width}x${vp.height}`);
    await page.keyboard.press("Escape");
  }
  await ctx.close();
}
// text spacing at 375x812
{
  const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true }); const page = await ctx.newPage();
  await login(page, "typical");
  for (const [n, u, fn] of [["dashboard", "/", null], ["savings", "/savings", null], ["add-standard-dialog", "/", async () => { await page.getByRole("button", { name: "Tambah pengeluaran" }).click(); await page.waitForTimeout(400); await page.getByRole("button", { name: "Standar", exact: true }).click(); }], ["sub-add-dialog", "/subscriptions", () => page.getByRole("button", { name: "Tambah", exact: true }).click()]]) {
    await page.goto(BASE + u); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(400);
    if (fn) { await fn(); await page.waitForTimeout(600); }
    const before = await page.evaluate(CLIP);
    await page.addStyleTag({ content: SPACING }); await page.waitForTimeout(400);
    const after = await page.evaluate(CLIP);
    const ov = await overflow(page);
    const rec = { textSpacing: n, clippedBefore: before.length, clippedAfter: after.length, newlyClipped: after.filter((a) => !before.includes(a)).slice(0, 6), overflowX: ov.overflowX, scrollWidth: ov.scrollWidth };
    console.log(JSON.stringify(rec)); res.push(rec);
    await shot(page, "B", `textspacing-${n}`);
  }
  await ctx.close();
}
writeFileSync(OUT + "/B-reflow.json", JSON.stringify(res, null, 1));
await b.close();
