import { open, goHome, txt, shot, BASE } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(600);
await page.getByText('Notifikasi & Pengingat').click(); await page.waitForTimeout(1500);
const dl=()=>page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>'modal='+d.getAttribute('aria-modal')+' | '+d.innerText.replace(/\n+/g,' | ')).join('')||document.body.innerText.slice(0,900));
console.log("NOTIF (no permission):", await dl()); await shot(page,"D","N01-notif-default");
console.log(await page.evaluate(()=>[...document.querySelectorAll('button,input,select')].filter(e=>e.getBoundingClientRect().height>0).map(e=>(e.tagName+':'+(e.innerText||e.getAttribute('aria-label')||e.type)).trim().replace(/\n/g,' ').slice(0,36)+'@'+Math.round(e.getBoundingClientRect().height)).join(' ; ')));
await b.close();
