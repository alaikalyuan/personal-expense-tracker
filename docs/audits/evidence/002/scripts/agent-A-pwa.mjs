// PWA / offline / cross-account cache privacy test (prod server). Never prints credentials.
import { launch, newContext, login, BASE, OUT, VIEWPORTS } from './lib.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(OUT, 'shots', 'A'); mkdirSync(dir, { recursive: true });
const res = {};
const browser = await launch();
const ctx = await newContext(browser, { viewport: VIEWPORTS['375x812'], theme: 'light' });
const page = await ctx.newPage();
const swState = async () => page.evaluate(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  const keys = await caches.keys();
  const caches_ = {};
  for (const k of keys) { const c = await caches.open(k); caches_[k] = (await c.keys()).map((r) => r.url); }
  return { regs: regs.map((r) => ({ scope: r.scope, active: r.active?.state, script: r.active?.scriptURL, waiting: !!r.waiting })), controller: !!navigator.serviceWorker.controller, caches: caches_ };
});
const bodyText = async () => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
const grab = async (name) => { await page.screenshot({ path: join(dir, name + '.png') }); };

// 1. typical online
await login(page, 'typical');
await page.goto(BASE + '/'); await page.waitForTimeout(2500);
await page.reload(); await page.waitForTimeout(2000);
await page.goto(BASE + '/savings'); await page.waitForTimeout(2000);
await page.reload(); await page.waitForTimeout(2000);
res.afterTypical = await swState();
// response headers of dynamic html (signed in)
const r = await ctx.request.get(BASE + '/savings');
res.savingsHeaders = { status: r.status(), cacheControl: r.headers()['cache-control'], vary: r.headers()['vary'] };
const r2 = await ctx.request.get(BASE + '/sw.js'); res.swHeaders = { status: r2.status(), cacheControl: r2.headers()['cache-control'], ct: r2.headers()['content-type'] };
const r3 = await ctx.request.get(BASE + '/manifest.webmanifest'); res.manifest = { status: r3.status(), ct: r3.headers()['content-type'], body: await r3.json() };
const r4 = await ctx.request.get(BASE + '/offline.html'); res.offlineHtml = { status: r4.status(), cacheControl: r4.headers()['cache-control'] };
// 2. sign out typical
await page.goto(BASE + '/'); await page.waitForTimeout(1500);
await page.locator('button[aria-label*="enu" i]').first().click(); await page.waitForTimeout(800);
const so = page.getByRole('button', { name: /Keluar/i }).first();
res.signOutFound = (await so.count()) > 0;
if (res.signOutFound) { await so.click(); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2000); }
res.afterSignOutUrl = page.url().replace(BASE, '');
res.afterSignOutCookies = (await ctx.cookies()).filter((c) => c.name.includes('auth-token')).length;
await grab('pwa-01-signed-out-online');
// 3. sign in as empty
await login(page, 'empty');
await page.goto(BASE + '/'); await page.waitForTimeout(2500);
res.emptyOnlineText = (await bodyText()).slice(0, 200);
res.emptyHasA002Online = (await bodyText()).includes('[A002]');
await grab('pwa-02-empty-online');
res.afterEmpty = await swState();
// 4. offline as empty
await ctx.setOffline(true);
res.offlineEmpty = {};
for (const p of ['/', '/savings']) {
  let status = 'ok', txt = '';
  try { const resp = await page.goto(BASE + p, { timeout: 15000 }); status = resp ? resp.status() : 'null'; await page.waitForTimeout(800); txt = await bodyText(); } catch (e) { status = 'ERR ' + String(e.message).split('\n')[0].slice(0, 100); }
  res.offlineEmpty[p] = { status, title: await page.title().catch(() => ''), text: txt.slice(0, 260), hasA002: txt.includes('[A002]'), hasTypicalMarkers: /Spotify|Laptop|Kos|Mudik/.test(txt) };
  await grab('pwa-03-empty-offline' + p.replace(/\//g, '_'));
}
await ctx.setOffline(false);
// 5. sign out empty then offline signed-out
await page.goto(BASE + '/'); await page.waitForTimeout(1500);
await page.locator('button[aria-label*="enu" i]').first().click().catch(() => {}); await page.waitForTimeout(800);
const so2 = page.getByRole('button', { name: /Keluar/i }).first();
if (await so2.count()) { await so2.click(); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2000); }
res.signedOutCookies2 = (await ctx.cookies()).filter((c) => c.name.includes('auth-token')).length;
await ctx.setOffline(true);
res.offlineSignedOut = {};
for (const p of ['/', '/savings']) {
  let status = 'ok', txt = '';
  try { const resp = await page.goto(BASE + p, { timeout: 15000 }); status = resp ? resp.status() : 'null'; await page.waitForTimeout(800); txt = await bodyText(); } catch (e) { status = 'ERR ' + String(e.message).split('\n')[0].slice(0, 100); }
  res.offlineSignedOut[p] = { status, title: await page.title().catch(() => ''), text: txt.slice(0, 260), hasA002: txt.includes('[A002]') };
  await grab('pwa-04-signedout-offline' + p.replace(/\//g, '_'));
}
// 6. client-side nav offline? (soft navigation when SW doesn't cache RSC)
await ctx.setOffline(false);
await browser.close();
writeFileSync(join(OUT, 'lighthouse', 'A-pwa.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1).slice(0, 6000));
