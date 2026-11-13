import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/subscriptions"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const posts=[]; page.on('request',r=>{if(r.method()==='POST')posts.push(1)});
await page.getByRole('button',{name:/Tambah/}).first().click(); await page.waitForTimeout(700);
await page.locator('input[placeholder^="cth: Spotify"]').fill("[A002] Spotify uji");
await page.locator('input[type=number]').first().fill("34990");
await page.locator('input[type=date]').fill("2026-11-16");
// toggle split on
const cb=page.locator('[role=dialog] input[type=checkbox], form input[type=checkbox]').first(); await cb.check(); await page.waitForTimeout(500);
await shot(page,"D","F02-sub-split-on",{fullPage:true});
console.log("after split on:", await page.evaluate(()=>{const t=(document.querySelector('[role=dialog]')||document.body).innerText; const i=t.indexOf('Patungan Akun'); return t.slice(i).replace(/\n+/g,' | ')}));
console.log(await page.evaluate(()=>[...document.querySelectorAll('input')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.type+'|ph='+e.placeholder+'|v='+e.value).join('\n')));
await b.close();
