import { launch, newContext, login, BASE, OUT } from './lib.mjs';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { join } from 'node:path';
const REPO = 'C:/Users/yuana/Documents/personal-expense-tracker';
const STATIC = join(REPO, '.next/static');
function walk(d) { let r = []; for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) r = r.concat(walk(p)); else r.push(p); } return r; }
const files = walk(STATIC);
const cache = new Map();
function sz(rel) { // rel like /_next/static/chunks/x.js
  if (cache.has(rel)) return cache.get(rel);
  const p = join(REPO, '.next', rel.replace(/^\/_next\//, ''));
  if (!existsSync(p)) { cache.set(rel, null); return null; }
  const b = readFileSync(p);
  const o = { raw: b.length, gz: gzipSync(b).length, gz9: gzipSync(b, { level: 9 }).length, br: brotliCompressSync(b).length };
  cache.set(rel, o); return o;
}
const js = files.filter(f => f.endsWith('.js')), css = files.filter(f => f.endsWith('.css'));
const tot = (arr) => arr.reduce((a, f) => { const s = sz('/_next/static/' + f.slice(STATIC.length + 1).replace(/\\/g, '/')); a.raw += s.raw; a.gz += s.gz; a.gz9 += s.gz9; a.br += s.br; return a; }, { raw: 0, gz: 0, gz9: 0, br: 0, n: arr.length });
const report = { totals: { js: { ...tot(js), n: js.length }, css: { ...tot(css), n: css.length } } };
// largest chunks
const sigs = ['micromark', 'remark', 'react-markdown', 'qrcode', 'confetti', '@supabase', 'GoTrueClient', 'react-dom', 'scheduler', 'recharts', 'react-easy-crop', 'lucide', 'Sparkles', 'webpack', 'PostgrestClient', 'getUserMedia', 'ReactCrop'];
const big = js.map(f => { const rel = '/_next/static/' + f.slice(STATIC.length + 1).replace(/\\/g, '/'); const s = sz(rel); const txt = readFileSync(f, 'utf8'); const hits = sigs.filter(x => txt.includes(x)); return { file: rel.replace('/_next/static/chunks/', ''), ...s, hits }; }).sort((a, b) => b.raw - a.raw).slice(0, 15);
report.biggest = big;
mkdirSync(OUT + '/lighthouse', { recursive: true });

// route first-load
const routes = ['/', '/savings', '/saku', '/subscriptions', '/split', '/split/new', '/split/49b6b834-5267-4822-82bb-f654d1045ee3', '/compare', '/archive'];
function parseScripts(html) {
  const set = new Set();
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) set.add(m[1].split('?')[0]);
  const pre = new Set();
  for (const m of html.matchAll(/<link[^>]*rel="preload"[^>]*as="script"[^>]*href="([^"]+)"/g)) pre.add(m[1].split('?')[0]);
  for (const m of html.matchAll(/<link[^>]*href="([^"]+\.js[^"]*)"[^>]*as="script"/g)) pre.add(m[1].split('?')[0]);
  const css = new Set(); for (const m of html.matchAll(/<link[^>]*href="([^"]+\.css[^"]*)"/g)) css.add(m[1].split('?')[0]);
  return { scripts: [...set], preload: [...pre], css: [...css] };
}
const sum = (arr) => arr.reduce((a, u) => { const s = sz(u); if (s) { a.raw += s.raw; a.gz += s.gz; a.gz9 += s.gz9; a.br += s.br; } else a.missing++; return a; }, { raw: 0, gz: 0, gz9: 0, br: 0, missing: 0, n: arr.length });
const browser = await launch();
const out = [];
async function fetchRoutes(label, ctx, rs) {
  for (const r of rs) {
    const resp = await ctx.request.get(BASE + r, { maxRedirects: 0 });
    const status = resp.status(); const loc = resp.headers()['location'];
    const html = await resp.text();
    const p = parseScripts(html);
    const all = [...new Set([...p.scripts, ...p.preload])].filter(u => u.startsWith('/_next/'));
    const sj = sum(all.filter(u => u.endsWith('.js'))); const sc = sum(p.css.filter(u => u.startsWith('/_next/')));
    out.push({ auth: label, route: r, status, redirect: loc || null, htmlBytes: html.length, js: sj, css: sc, chunks: all.filter(u => u.endsWith('.js')).map(u => u.replace('/_next/static/chunks/', '')) });
  }
}
const anon = await newContext(browser, {});
await fetchRoutes('signed-out', anon, routes);
for (const role of ['typical', 'large']) {
  const ctx = await newContext(browser, {}); const page = await ctx.newPage(); await login(page, role);
  await fetchRoutes(role, ctx, role === 'typical' ? routes : ['/']);
  await ctx.close();
}
report.routes = out;
await browser.close();
writeFileSync(OUT + '/lighthouse/A-bundle.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.totals));
console.log(JSON.stringify(report.biggest.slice(0, 12).map(b => [b.file, b.raw, b.gz, b.hits.join(',')])));
for (const o of out) console.log(o.auth.padEnd(10), o.route.slice(0, 22).padEnd(23), o.status, o.redirect || '', 'js n=' + o.js.n, 'raw=' + o.js.raw, 'gz=' + o.js.gz, 'gz9=' + o.js.gz9, 'br=' + o.js.br, 'css=' + o.css.raw + '/' + o.css.gz, 'miss=' + o.js.missing, 'html=' + o.htmlBytes);
