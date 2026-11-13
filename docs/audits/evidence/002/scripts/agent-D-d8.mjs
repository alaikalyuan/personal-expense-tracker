import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("guest");
await goHome(page);
await page.getByRole('button',{name:'Bagikan / Ekspor'}).click(); await page.waitForTimeout(900);
console.log("GUEST EXPORT:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ')).join('')));
await shot(page,"D","D12-guest-export-default500k");
await b.close();
