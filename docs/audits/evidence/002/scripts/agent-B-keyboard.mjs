import { launch, newContext, login, shot, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const theme = process.argv[2] || "light";
const b = await launch();
const ctx = await newContext(b, { theme, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
await page.goto(BASE + "/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);

const probe = () => page.evaluate(() => {
  const a = document.activeElement;
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  const vh = window.innerHeight;
  // fixed layers
  const fixed = [...document.querySelectorAll("body *")].filter((e) => { const s = getComputedStyle(e); return s.position === "fixed" && e.getBoundingClientRect().width > 0 && s.pointerEvents !== "none" && !e.contains(a) && !a.contains(e); }).map((e) => ({ t: e.tagName.toLowerCase(), r: e.getBoundingClientRect() }));
  const overl = fixed.filter((f) => !(r.bottom <= f.r.top || r.top >= f.r.bottom || r.right <= f.r.left || r.left >= f.r.right));
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
  const top = document.elementFromPoint(cx, cy);
  return {
    tag: a.tagName.toLowerCase(), name: (a.getAttribute("aria-label") || a.innerText || a.placeholder || a.title || "").trim().replace(/\s+/g, " ").slice(0, 36),
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} off=${cs.outlineOffset}`, boxShadow: cs.boxShadow === "none" ? "" : cs.boxShadow.slice(0, 60),
    offscreen: r.bottom > vh || r.top < 0,
    obscuredByFixed: overl.map((o) => o.t + "@" + Math.round(o.r.top) + "-" + Math.round(o.r.bottom)).join(","),
    centerCoveredBy: top && !(a.contains(top) || top.contains(a)) ? top.tagName.toLowerCase() + "." + String(top.className).slice(0, 40) : "",
  };
});

const stops = [];
for (let i = 0; i < 45; i++) { await page.keyboard.press("Tab"); const p = await probe(); stops.push(p); if (i > 3 && p.tag === "body") break; }
writeFileSync(OUT + `/B-tabstops-${theme}.json`, JSON.stringify(stops, null, 1));
for (const s of stops) console.log(`${s.tag}|${s.name}|rect=${s.rect}|outline=${s.outline}|shadow=${s.boxShadow}|offscr=${s.offscreen}|fixedOverlap=${s.obscuredByFixed}|covered=${s.centerCoveredBy}`);
await shot(page, "B", `kb-last-${theme}`);
await b.close();
