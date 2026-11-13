import { launch, newContext, login, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const SPLIT = "49b6b834-5267-4822-82bb-f654d1045ee3";
const b = await launch();
const all = [];

const scan = () => page_scan;
const SCAN = () => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; // alpha-premult safe: draw over transparent
    // re-draw to get alpha
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const p = cx.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2], p[3] / 255]; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); if (a === 0) return [0, 0, 0, 0]; return [0, 1, 2].map((i) => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat([a]); };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b2) => { const l1 = lum(a), l2 = lum(b2); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const page = getComputedStyle(document.documentElement).colorScheme.includes("dark") ? [24, 24, 27, 1] : [255, 255, 255, 1];
  const bodyBg = rgba(getComputedStyle(document.body).backgroundColor); const rootBase = bodyBg[3] > 0 ? bodyBg : page;
  const res = []; const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = walker.nextNode())) {
    const txt = n.nodeValue.trim(); if (!txt) continue; const el = n.parentElement; if (!el) continue;
    if (el.closest("script,style,noscript,svg")) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
    // effective opacity
    let op = 1, e = el, imgBg = false; const layers = [];
    while (e && e.nodeType === 1) { const s = getComputedStyle(e); op *= parseFloat(s.opacity); if (s.backgroundImage !== "none" && !s.backgroundImage.startsWith("none")) imgBg = true; const bg = rgba(s.backgroundColor); if (bg[3] > 0) layers.push(bg); if (bg[3] >= 1 && !imgBg) break; e = e.parentElement; }
    let bg = rootBase; for (const l of layers.reverse()) bg = over(l, bg);
    let fg = rgba(cs.color); fg = [fg[0], fg[1], fg[2], fg[3] * op]; const fgc = over(fg, bg);
    const cr = ratio(fgc, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    // sample onscreen? include only if rect intersects page
    if (cr < need) { const key = el.tagName + txt.slice(0, 20) + cr.toFixed(2); if (seen.has(key)) continue; seen.add(key); res.push({ text: txt.slice(0, 32), cr: +cr.toFixed(2), need, size: Math.round(size * 10) / 10, op: +op.toFixed(2), fg: fgc.slice(0, 3).map(Math.round).join(","), bg: bg.slice(0, 3).map(Math.round).join(","), imgBg, cls: String(el.className).slice(0, 50) }); }
  }
  let total = 0; const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w2.nextNode()) if (w2.currentNode.nodeValue.trim() && w2.currentNode.parentElement.getBoundingClientRect().width > 0) total++;
  return { total, fails: res };
};

async function scanPage(label, page) {
  const r = await page.evaluate(SCAN);
  all.push({ label, total: r.total, failCount: r.fails.length, fails: r.fails });
  console.log(label, "textNodes", r.total, "fails", r.fails.length, JSON.stringify(r.fails.slice(0, 6).map((f) => `${f.text}|${f.cr}|${f.size}px|op${f.op}`)));
}
for (const theme of ["light", "dark"]) {
  let ctx = await newContext(b, { theme, hasTouch: true, isMobile: true }); let page = await ctx.newPage();
  await login(page, "typical");
  for (const u of ["/", "/savings", "/split/" + SPLIT, "/compare"]) { await page.goto(BASE + u); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(700); await scanPage(`${theme} ${u.slice(0, 12)}`, page); }
  await ctx.close();
  ctx = await newContext(b, { theme, hasTouch: true, isMobile: true }); page = await ctx.newPage();
  await page.goto(BASE + "/?auth=login"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); await scanPage(`${theme} login-dialog`, page);
  await page.goto(BASE + "/split/" + SPLIT); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); await scanPage(`${theme} friend-view signed-out`, page);
  await ctx.close();
  for (const palette of ["pink", "blue", "mono"]) {
    ctx = await newContext(b, { theme, palette, hasTouch: true, isMobile: true }); page = await ctx.newPage();
    await login(page, "typical"); await page.goto(BASE + "/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700);
    await scanPage(`${theme} ${palette} /`, page);
    await ctx.close();
  }
}
writeFileSync(OUT + "/B-contrast.json", JSON.stringify(all, null, 1));
await b.close();
