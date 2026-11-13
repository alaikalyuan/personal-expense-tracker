import { open, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await page.goto("http://localhost:3100/split/new"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const n=page.locator('input[placeholder^="Menu #"]').first(); await n.fill("[A002] x");
const row=n.locator('xpath=ancestor::div[.//input[@type="number"]][1]'); const nums=row.locator('input[type=number]');
await nums.nth(0).fill("1"); await nums.nth(1).fill("25000");
console.log(await page.evaluate(()=>[...document.querySelectorAll('input[type=number]')].slice(0,2).map(i=>({w:Math.round(i.getBoundingClientRect().width),val:i.value,sw:i.scrollWidth,cw:i.clientWidth,pad:getComputedStyle(i).paddingLeft+'/'+getComputedStyle(i).paddingRight,fs:getComputedStyle(i).fontSize}))));
await n.scrollIntoViewIfNeeded(); await page.screenshot({path:"../out/shots/D/E03-row-clip.png", clip:{x:0,y:0,width:375,height:812}});
await b.close();
