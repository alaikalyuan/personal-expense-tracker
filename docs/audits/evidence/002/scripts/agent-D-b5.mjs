import { open, goHome, txt, openAdd, preview, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page); await openAdd(page);
const reqs=[]; page.on('request',r=>{ if(r.method()==='POST') reqs.push(1); });
await page.getByRole('button',{name:'Standar'}).click(); await page.waitForTimeout(600);
const amt = page.locator('input[inputmode=numeric]').first();
const name = page.locator('input[placeholder="Nama pengeluaran"]');
const sub = page.locator('button[type=submit]').filter({hasText:'Tambah pengeluaran'});
for (const v of ["0","-5","abc","15.000,50","1.000.000","15000","12345678901234","1e5"]) {
  await amt.fill(""); await amt.pressSequentially(v); await page.waitForTimeout(250);
  console.log("typed", JSON.stringify(v), "-> field shows", JSON.stringify(await amt.inputValue()), "| submit disabled:", await sub.isDisabled());
}
// invalid submit attempts
await amt.fill(""); await name.fill("[A002] invalid test"); 
console.log("empty amount: disabled?", await sub.isDisabled());
await sub.click({force:true}).catch(()=>{}); await page.waitForTimeout(800);
console.log("after submit empty amount POSTs", reqs.length, "|", (await page.evaluate(()=>document.querySelector('[role=dialog]')?.innerText.slice(-300).replace(/\n+/g,' | '))));
await shot(page,"D","B06-empty-amount");
await amt.fill(""); await amt.pressSequentially("0"); 
await sub.click({force:true}).catch(()=>{}); await page.waitForTimeout(800);
console.log("amount 0 submit POSTs", reqs.length, "|", (await page.evaluate(()=>document.querySelector('[role=dialog]')?.innerText.slice(-200).replace(/\n+/g,' | '))));
await amt.fill(""); await amt.pressSequentially("15000"); await name.fill("");
console.log("blank name: disabled?", await sub.isDisabled());
await sub.click({force:true}).catch(()=>{}); await page.waitForTimeout(800);
console.log("blank name submit POSTs", reqs.length, "|", (await page.evaluate(()=>document.querySelector('[role=dialog]')?.innerText.slice(-200).replace(/\n+/g,' | '))));
await shot(page,"D","B07-blank-name");
console.log("validation msg:", await page.evaluate(()=>{const i=document.querySelector('input[placeholder="Nama pengeluaran"]'); return i.validationMessage}));
// cancel with typed data: close via Tutup / Escape / backdrop
await name.fill("[A002] typed then cancel");
await page.keyboard.press("Escape"); await page.waitForTimeout(700);
console.log("after Escape dialog open?", await page.locator('[role=dialog]').count(), "alertdialog/confirm text:", await page.evaluate(()=>document.body.innerText.includes('Buang')||document.body.innerText.includes('Batalkan')));
if(await page.locator('[role=dialog]').count()){ await page.getByRole('button',{name:'Tutup'}).first().click(); await page.waitForTimeout(700); console.log("after Tutup dialog open?", await page.locator('[role=dialog]').count());}
await shot(page,"D","B08-after-cancel");
await openAdd(page); console.log("reopen: standard tab? value kept?", await page.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.placeholder+'='+i.value).join(';')));
await b.close();
