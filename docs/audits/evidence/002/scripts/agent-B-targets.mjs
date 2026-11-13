import { launch, newContext, login, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const SPLIT = "49b6b834-5267-4822-82bb-f654d1045ee3";
const b = await launch();
const out = [];

const MEASURE = () => {
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=checkbox],[role=switch],[tabindex]:not([tabindex="-1"])';
  const scope = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop() || document;
  const els = [...scope.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden"; });
  const nm = (e) => (e.getAttribute("aria-label") || e.innerText || e.placeholder || e.title || e.type || "").trim().replace(/\s+/g, " ").slice(0, 32);
  const items = els.map((e) => { const r = e.getBoundingClientRect(); return { e, name: nm(e), tag: e.tagName.toLowerCase() + (e.type ? ":" + e.type : ""), w: Math.round(r.width), h: Math.round(r.height), cx: r.left + r.width / 2, cy: r.top + r.height / 2, rect: r }; });
  // spacing exception
  const rectDist = (cx, cy, r) => { const dx = Math.max(r.left - cx, 0, cx - r.right), dy = Math.max(r.top - cy, 0, cy - r.bottom); return Math.hypot(dx, dy); };
  for (const t of items) {
    t.under24 = t.w < 24 || t.h < 24; t.under44 = t.w < 44 || t.h < 44;
    t.spacingOK = null;
    if (t.under24) {
      t.spacingOK = true;
      for (const o of items) { if (o === t || t.e.contains(o.e) || o.e.contains(t.e)) continue;
        if (o.under24 ? Math.hypot(o.cx - t.cx, o.cy - t.cy) < 24 : rectDist(t.cx, t.cy, o.rect) < 12) { t.spacingOK = false; break; } }
    }
  }
  // effective hit size for those under 44
  const coarse = matchMedia("(pointer: coarse)").matches;
  for (const t of items) {
    t.eff = null;
    if (!t.under44) continue;
    t.e.scrollIntoView({ block: "center", inline: "nearest" });
    const r = t.e.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) { t.eff = "offscreen"; continue; }
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (let y = Math.max(0, r.top - 30); y <= Math.min(innerHeight - 1, r.bottom + 30); y += 2)
      for (let x = Math.max(0, r.left - 30); x <= Math.min(innerWidth - 1, r.right + 30); x += 2) {
        const h = document.elementFromPoint(x, y);
        if (h && (h === t.e || t.e.contains(h))) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      }
    t.eff = maxX < 0 ? "none" : `${maxX - minX + 2}x${maxY - minY + 2}`;
    t.effW = maxX < 0 ? 0 : maxX - minX + 2; t.effH = maxX < 0 ? 0 : maxY - minY + 2;
  }
  window.scrollTo(0, 0);
  return { coarse, items: items.map(({ e, rect, ...rest }) => rest) };
};

async function measure(label, page) {
  const r = await page.evaluate(MEASURE);
  const its = r.items;
  const u24 = its.filter((t) => t.under24), u24fail = u24.filter((t) => !t.spacingOK), u44 = its.filter((t) => t.under44);
  const eff44 = u44.filter((t) => typeof t.effW === "number" && (t.effW < 44 || t.effH < 44));
  const rec = { label, coarse: r.coarse, total: its.length, under24: u24.length, under24_failSpacing: u24fail.length, under44: u44.length, effUnder44: eff44.length, worst: u24fail.slice(0, 8).map((t) => `${t.name}|${t.tag}|${t.w}x${t.h}|eff ${t.eff}`), worst44: u44.sort((a, b) => a.w * a.h - b.w * b.h).slice(0, 8).map((t) => `${t.name}|${t.w}x${t.h}|eff ${t.eff}`), all: its };
  out.push(rec);
  console.log(`${label}: coarse=${r.coarse} total=${rec.total} <24=${rec.under24} (fail spacing exc ${rec.under24_failSpacing}) <44=${rec.under44} effective<44=${rec.effUnder44}\n   worst24: ${JSON.stringify(rec.worst)}\n   smallest: ${JSON.stringify(rec.worst44.slice(0, 5))}`);
}
const ctxA = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const pa = await ctxA.newPage();
for (const [l, u] of [["out /", "/"], ["out /?auth=login", "/?auth=login"], ["out friend", "/split/" + SPLIT]]) { await pa.goto(BASE + u); await pa.waitForLoadState("networkidle").catch(() => {}); await pa.waitForTimeout(600); await measure(l, pa); }
await ctxA.close();
const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
await page.goto(BASE + "/saku"); await page.waitForLoadState("networkidle");
const wid = await page.evaluate(() => [...document.querySelectorAll('a[href^="/saku/"]')].map((a) => a.getAttribute("href"))[0]);
for (const u of ["/", "/savings", "/saku", wid, "/subscriptions", "/split", "/split/new", "/split/" + SPLIT, "/split/" + SPLIT + "/edit", "/compare", "/archive"]) { await page.goto(BASE + u); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(600); await measure(u.slice(0, 18), page); }
// dialogs
const dlg = async (label, url, clickFn) => { await page.goto(BASE + url); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(400); await clickFn(); await page.waitForTimeout(700); await measure("DLG " + label, page); };
await dlg("menu", "/", () => page.getByRole("button", { name: "Buka menu" }).click());
await dlg("add-quick", "/", () => page.getByRole("button", { name: "Tambah pengeluaran" }).click());
await dlg("add-standard", "/", async () => { await page.getByRole("button", { name: "Tambah pengeluaran" }).click(); await page.waitForTimeout(400); await page.getByRole("button", { name: "Standar", exact: true }).click(); });
await dlg("edit-expense", "/", () => page.getByRole("button", { name: "Ubah [A002] Nasi padang" }).click());
await dlg("export", "/", () => page.getByRole("button", { name: "Bagikan / Ekspor" }).click());
await dlg("savings-goal-create", "/savings", () => page.getByRole("button", { name: "Tambah Target Baru" }).click());
await dlg("sub-add", "/subscriptions", () => page.getByRole("button", { name: "Tambah", exact: true }).click());
await dlg("saku-create", "/saku", () => page.getByRole("button", { name: "Tambah Saku" }).click());
await dlg("ai", "/", () => page.getByRole("button", { name: "Asisten Keuangan AI" }).click());
writeFileSync(OUT + "/B-targets.json", JSON.stringify(out, null, 1));
await b.close();
