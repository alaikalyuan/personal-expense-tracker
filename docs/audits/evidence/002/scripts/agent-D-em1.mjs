import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(600);
await page.getByText('Deteksi Email QRIS').click(); await page.waitForTimeout(1500);
const dl=()=>page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>'aria-modal='+d.getAttribute('aria-modal')+' | '+d.innerText.replace(/\n+/g,' | ')).join(''));
console.log("EMAIL SYNC:", await dl()); await shot(page,"D","EM01-email-sync");
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1)[0].querySelectorAll('button,input,textarea,a')? [...[...document.querySelectorAll('[role=dialog]')].slice(-1)[0].querySelectorAll('button,input,textarea,a')].map(e=>e.tagName+':'+(e.innerText||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\n/g,' ').slice(0,40)+'@h'+Math.round(e.getBoundingClientRect().height)).join(' ; '):''));
await b.close();
