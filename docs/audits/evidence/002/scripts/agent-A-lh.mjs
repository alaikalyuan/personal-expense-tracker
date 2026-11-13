// Lighthouse 13 mobile (default simulated throttling), navigation mode, performance category only.
// usage: node agent-A-lh.mjs <session: out|typical|large>
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { login, BASE, OUT } from './lib.mjs';

const session = process.argv[2];
const PORT = { out: 9222, typical: 9223, large: 9224 }[session];
const plan = {
  out: [['signed-out-home', '/', 3], ['friend-view', '/split/49b6b834-5267-4822-82bb-f654d1045ee3', 3]],
  typical: [['typical-home', '/', 3], ['typical-savings', '/savings', 3], ['typical-compare', '/compare', 3]],
  large: [['large-home', '/', 1]],
}[session];
const dir = join(OUT, 'lighthouse'); mkdirSync(dir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'a002-lh-' + session + '-'));
const ctx = await chromium.launchPersistentContext(profile, { headless: true, args: ['--remote-debugging-port=' + PORT], viewport: { width: 412, height: 823 } });
const page = ctx.pages()[0] || await ctx.newPage();
if (session !== 'out') { await login(page, session); }
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
const cdp = await ctx.newCDPSession(page);
const results = [];
for (const [label, path, n] of plan) {
  for (let i = 1; i <= n; i++) {
    await cdp.send('Network.clearBrowserCache').catch(() => {});
    await page.goto('about:blank');
    const t0 = Date.now();
    let r;
    try {
      r = await lighthouse(BASE + path, { port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['performance'], disableStorageReset: true });
    } catch (e) { console.log(label, i, 'FAILED', String(e.message).slice(0, 200)); results.push({ label, run: i, error: String(e.message) }); continue; }
    const lhr = r.lhr; const a = lhr.audits;
    const row = { label, run: i, finalUrl: lhr.finalDisplayedUrl, runWarnings: lhr.runWarnings, score: Math.round((lhr.categories.performance.score ?? 0) * 100), fcp: a['first-contentful-paint'].numericValue, lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue, si: a['speed-index'].numericValue, tti: a['interactive']?.numericValue, ttfb: a['server-response-time']?.numericValue, totalBytes: a['total-byte-weight']?.numericValue, lcpEl: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 120), secs: (Date.now() - t0) / 1000, env: lhr.environment.hostUserAgent, form: lhr.configSettings.formFactor, thr: lhr.configSettings.throttlingMethod };
    results.push(row);
    writeFileSync(join(dir, `A-${label}-run${i}.json`), JSON.stringify(lhr));
    console.log(label, i, JSON.stringify({ finalUrl: row.finalUrl, score: row.score, fcp: Math.round(row.fcp), lcp: Math.round(row.lcp), cls: +row.cls.toFixed(3), tbt: Math.round(row.tbt), si: Math.round(row.si), ttfb: Math.round(row.ttfb || 0) }));
  }
}
writeFileSync(join(dir, `A-summary-${session}.json`), JSON.stringify(results, null, 1));
await ctx.close();
