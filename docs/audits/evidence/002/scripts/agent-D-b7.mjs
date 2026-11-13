import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
await page.getByRole('button',{name:/Minggu Ini/}).click(); await page.waitForTimeout(800);
await page.getByText('[A002] fotokopi').click(); await page.waitForTimeout(900);
await shot(page,"D","B11-edit-open");
console.log("EDIT:", await page.evaluate(()=>(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | ').slice(0,900)));
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog] input,[role=dialog] select,[role=dialog] textarea,[role=dialog] button')].map(e=>e.tagName+'|'+e.type+'|'+(e.value||'')+'|'+(e.placeholder||'')+'|'+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,30)).join('\n')));
await b.close();
