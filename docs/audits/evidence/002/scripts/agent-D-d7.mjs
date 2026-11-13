import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await page.goto("http://localhost:3100/archive"); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>[...document.querySelectorAll('button,a')].map(e=>(e.innerText||e.getAttribute('aria-label')||'?').trim().replace(/\n+/g,' ').slice(0,40)).join(' ; ')));
await page.getByText('Buka semua').click().catch(()=>{}); await page.waitForTimeout(700);
console.log("ARCH:", await txt(page,1600));
await shot(page,"D","D10-archive-open");
const ex = page.getByRole('button',{name:/Ekspor|Bagikan|Share|Export/i});
console.log("export btn count", await ex.count());
if(await ex.count()){ await ex.first().click(); await page.waitForTimeout(900); console.log("ARCH EXPORT:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ')).join(''))); await shot(page,"D","D11-archive-export"); }
await b.close();
