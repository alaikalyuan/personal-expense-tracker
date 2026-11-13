// Read-only: can `empty` open someone else's split bill edit page? Does typical see edit page? Signed-out redirect?
import { launch, newContext, login, BASE, OUT } from './lib.mjs';
import { join } from 'node:path';
const ID = '49b6b834-5267-4822-82bb-f654d1045ee3';
const browser = await launch();
const out = {};
async function probe(role) {
  const ctx = await newContext(browser, {}); const page = await ctx.newPage();
  if (role) await login(page, role);
  const resp = await page.goto(`${BASE}/split/${ID}/edit`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const txt = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  out[role || 'signed-out'] = { finalUrl: page.url().replace(BASE, ''), status: resp.status(), hasEditorFields: /Simpan|Perbarui|Update/i.test(txt) && /Nasi goreng/.test(txt), firstText: txt.slice(0, 120) };
  if (role === 'empty') await page.screenshot({ path: join(OUT, 'shots', 'A', 'authz-empty-edit.png') });
  await ctx.close();
}
await probe(null); await probe('empty'); await probe('typical');
// API routes unauthenticated (GET/POST without cookie)
const anon = await newContext(browser, {});
const r = {};
for (const [m, p] of [['POST', '/api/ai/advisor'], ['POST', '/api/ai/extract'], ['POST', '/api/email/parse-paste'], ['POST', '/api/notifications/subscribe'], ['POST', '/api/notifications/test'], ['GET', '/api/cron/notifications'], ['POST', '/api/email/inbound']]) {
  const resp = await anon.request.fetch(BASE + p, { method: m, data: m === 'POST' ? {} : undefined, failOnStatusCode: false });
  r[m + ' ' + p] = resp.status();
}
out.apiAnon = r;
await browser.close();
console.log(JSON.stringify(out, null, 1));
