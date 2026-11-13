// Shared helpers for Audit 002 Playwright scripts. Import from the tools directory.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const BASE = process.env.A002_BASE || "http://localhost:3100";
export const OUT = join(here, "..", "out");
const creds = JSON.parse(readFileSync(join(here, "..", "secrets", "creds.json"), "utf8"));
const AXE_SRC = readFileSync(join(here, "node_modules", "axe-core", "axe.min.js"), "utf8");

export const VIEWPORTS = {
  "320x640": { width: 320, height: 640 },
  "375x812": { width: 375, height: 812 },
  "430x932": { width: 430, height: 932 },
  "768x1024": { width: 768, height: 1024 },
  "1024x768": { width: 1024, height: 768 },
  "1280x800": { width: 1280, height: 800 },
  "1440x900": { width: 1440, height: 900 },
};

export async function launch(opts = {}) {
  return chromium.launch({ headless: true, ...opts });
}

/** New context; theme is "light" | "dark". Theme is applied via the app's THEME cookie and colorScheme. */
export async function newContext(browser, { viewport = VIEWPORTS["375x812"], theme = "light", palette, ...rest } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, ...rest });
  const cookies = [{ name: "THEME", value: theme, url: BASE }];
  if (palette) cookies.push({ name: "PALETTE", value: palette, url: BASE });
  await ctx.addCookies(cookies);
  return ctx;
}

/** Sign in through the app's own dialog. role: empty | typical | large | journey. Never logs the password. */
export async function login(page, role) {
  const c = creds[role];
  if (!c) throw new Error(`unknown role ${role}`);
  await page.goto(`${BASE}/?auth=login`);
  // Default tab is "Masuk" (sign in)
  await page.locator('input[type="email"]').fill(c.email);
  await page.locator('input[type="password"]').fill(c.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  const ok = (await page.context().cookies()).some((k) => k.name.includes("auth-token"));
  if (!ok) throw new Error(`login failed for ${role}`);
}

export async function axe(page, { include } = {}) {
  await page.addScriptTag({ content: AXE_SRC });
  return page.evaluate(async (inc) => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(inc || document, { resultTypes: ["violations", "incomplete"] });
    const slim = (arr) => arr.map((v) => ({ id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => t.startsWith("wcag")), nodes: v.nodes.slice(0, 8).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary || "").slice(0, 300) })), count: v.nodes.length }));
    return { violations: slim(r.violations), incomplete: slim(r.incomplete) };
  }, include);
}

export async function shot(page, agent, name, opts = {}) {
  const dir = join(OUT, "shots", agent);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${name}.png`);
  await page.screenshot({ path: p, ...opts });
  return p;
}

/** Horizontal overflow + elements wider than viewport. */
export async function overflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed") {
        wide.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`);
        if (wide.length > 10) break;
      }
    }
    return { viewport: vw, scrollWidth: sw, overflowX: sw > vw + 1, offenders: wide };
  });
}

/** Interactive targets with their rendered size. */
export async function targets(page) {
  return page.evaluate(() => {
    const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=link],[role=checkbox],[role=switch],[tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((e) => {
      const r = e.getBoundingClientRect();
      const name = (e.getAttribute("aria-label") || e.innerText || e.getAttribute("placeholder") || e.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return { tag: e.tagName.toLowerCase(), name, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) };
    });
  });
}

export function ensureDir(p) { mkdirSync(p, { recursive: true }); return p; }
