import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
await page.getByText('1 transaksi dari email menunggu dicatat').click(); await page.waitForTimeout(800);
await shot(page,"D","EM06-pending-expanded");
console.log(await page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('transaksi dari email'); return t.slice(i,i+500).replace(/\n+/g,' | ')}));
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>(e.innerText||e.getAttribute('aria-label')||'?').trim().replace(/\n/g,' ').slice(0,28)+'@'+Math.round(e.getBoundingClientRect().height)).slice(3,14)));
await b.close();
