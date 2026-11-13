import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page); await openAdd(page);
await page.getByRole('button',{name:'Standar'}).click(); await page.waitForTimeout(400);
await page.getByRole('button',{name:/\[A002\] Saku Kos/}).click();
await page.locator('input[inputmode=numeric]').first().pressSequentially("25000");
await page.getByRole('button',{name:/^Tagihan/}).click();
await page.locator('input[placeholder="Nama pengeluaran"]').fill("[A002] token listrik kos");
await page.locator('button[type=submit]').filter({hasText:'Tambah pengeluaran'}).click(); await page.waitForTimeout(2500);
const dashTxt=async(l)=>console.log(l, await txt(page,420));
await goHome(page); await dashTxt("SEMUA SAKU:");
// switch to each saku
await page.getByText('Semua Saku').first().click(); await page.waitForTimeout(600);
console.log("SWITCHER:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog],[role=listbox],[role=menu]')].map(d=>d.innerText.replace(/\n+/g,' | ').slice(0,300)).join('##') || 'none-role'));
await shot(page,"D","K06-saku-switcher");
await b.close();
