// Collect console errors/warnings, page errors and failed/4xx-5xx requests across routes (signed in as typical).
// A002_BASE selects dev (3000) or prod (3100).
import { launch, newContext, login, BASE, OUT } from './lib.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const tag = BASE.includes('3000') ? 'dev' : 'prod';
const routes = ['/', '/savings', '/saku', '/subscriptions', '/split', '/split/new', '/split/49b6b834-5267-4822-82bb-f654d1045ee3', '/compare', '/archive'];
const browser = await launch();
const ctx = await newContext(browser, {});
const page = await ctx.newPage();
const events = [];
let cur = 'login';
page.on('console', (m) => { const t = m.type(); if (['error', 'warning'].includes(t)) events.push({ route: cur, kind: 'console.' + t, text: m.text().slice(0, 500), loc: (m.location().url || '').replace(BASE, '').slice(0, 80) }); });
page.on('pageerror', (e) => events.push({ route: cur, kind: 'pageerror', text: String(e.message).slice(0, 500) }));
page.on('requestfailed', (r) => events.push({ route: cur, kind: 'requestfailed', text: `${r.method()} ${r.url().replace(BASE, '').slice(0, 120)} ${r.failure()?.errorText}` }));
page.on('response', (r) => { if (r.status() >= 400) events.push({ route: cur, kind: 'http' + r.status(), text: `${r.request().method()} ${r.url().replace(BASE, '').slice(0, 140)}` }); });
await login(page, 'typical');
const visited = [];
for (const r of routes) {
  cur = r;
  const t0 = Date.now();
  try {
    await page.goto(BASE + r, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(tag === 'dev' ? 4000 : 2000);
    visited.push([r, page.url().replace(BASE, ''), Date.now() - t0]);
    if (r === '/') {
      const menu = page.locator('button[aria-label*="enu" i]').first();
      if (await menu.count()) { await menu.click(); await page.waitForTimeout(1200); await page.screenshot({ path: join(OUT, 'shots', 'A', `menu-${tag}.png`) }); await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
      else events.push({ route: r, kind: 'note', text: 'menu button not found' });
    }
  } catch (e) { visited.push([r, 'ERR ' + String(e.message).slice(0, 100), Date.now() - t0]); }
}
await browser.close();
mkdirSync(join(OUT, 'lighthouse'), { recursive: true });
writeFileSync(join(OUT, 'lighthouse', `A-console-${tag}.json`), JSON.stringify({ visited, events }, null, 1));
console.log(tag, JSON.stringify(visited));
const map = new Map();
for (const e of events) { const k = e.kind + '|' + e.text; const v = map.get(k) || { ...e, routes: new Set(), n: 0 }; v.routes.add(e.route); v.n++; map.set(k, v); }
console.log('total events', events.length, 'unique', map.size);
for (const v of map.values()) console.log(`[${v.kind}] x${v.n} routes=${[...v.routes].map(x => x.slice(0, 12)).join(',')} :: ${v.text.replace(/\s+/g, ' ').slice(0, 300)}`);
