import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
const inp = page.locator('input[placeholder*="cth"]').first();
for (const s of ["Rp 15.000 lunch","kopi 18rb","gojek 22.500 kemarin","makan 25k Rabu","2x kopi 18k semalam","15.000,50 lunch", "lunch 0", "abc"]) {
  await inp.fill(s); await page.waitForTimeout(600);
  console.log(JSON.stringify(s), "=>", await preview(page));
}
await inp.fill("Rp 15.000 lunch"); await page.waitForTimeout(600);
await shot(page,"D","B02-quickadd-preview");
// examine preview dropdown controls
console.log(await page.evaluate(()=>[...document.querySelectorAll('select')].map(s=>s.value+' ['+[...s.options].map(o=>o.text).join(',')+']')));
await b.close();
