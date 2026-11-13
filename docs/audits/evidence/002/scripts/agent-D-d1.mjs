import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
// From the budget card? find edit control
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].map(b=>(b.innerText.trim()||b.getAttribute('aria-label')||'?').slice(0,30)+'@'+Math.round(b.getBoundingClientRect().y)).join(' ; ')));
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(600);
await page.getByText('Budget Mingguan').click(); await page.waitForTimeout(800);
await shot(page,"D","D01-budget-dialog");
console.log("BUDGET DIALOG:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ')).join('')));
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1)[0].querySelectorAll('input,button')? [...[...document.querySelectorAll('[role=dialog]')].slice(-1)[0].querySelectorAll('input,button')].map(e=>e.tagName+'|'+e.type+'|'+e.inputMode+'|'+e.value+'|'+e.placeholder+'|'+(e.innerText||e.getAttribute('aria-label')||'').slice(0,25)+'|h'+Math.round(e.getBoundingClientRect().height)).join('\n'):''));
await b.close();
