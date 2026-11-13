import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
await page.getByRole('button',{name:'Upload Foto'}).click(); await page.waitForTimeout(800);
await shot(page,"D","B15-photo-mode");
console.log(await page.evaluate(()=>(document.querySelector('[role=dialog]')||document.body).innerText.replace(/\n+/g,' | ').slice(0,1200)));
console.log(await page.evaluate(()=>[...document.querySelectorAll('input[type=file]')].map(i=>i.accept+'|'+i.multiple+'|capture='+i.getAttribute('capture'))));
await b.close();
