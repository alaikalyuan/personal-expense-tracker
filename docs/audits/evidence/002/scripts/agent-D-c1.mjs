import { open, goHome, txt, openAdd, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
const items=[["[A002] buku kuliah","45000","Kuliah","2026-11-05"],["[A002] bensin motor","30000","Transportasi","2026-11-02"],["[A002] nonton bioskop","50000","Hiburan","2026-10-20"],["[A002] sarapan bubur","8000","Makanan","2026-11-10"]];
for (const [n,a,c,d] of items){
  await openAdd(page);
  await page.getByRole('button',{name:'Standar'}).click(); await page.waitForTimeout(400);
  await page.locator('input[inputmode=numeric]').first().pressSequentially(a);
  await page.getByRole('button',{name:new RegExp('^'+c)}).click();
  await page.locator('input[placeholder="Nama pengeluaran"]').fill(n);
  await page.getByRole('button',{name:'Pilih Tanggal'}).click(); await page.waitForTimeout(400);
  if(n.includes('buku')) { await shot(page,"D","C01-date-picker"); console.log(await page.evaluate(()=>[...document.querySelectorAll('input[type=date]')].map(i=>i.value+'|min='+i.min+'|max='+i.max))); }
  await page.locator('input[type=date]').first().fill(d); await page.waitForTimeout(300);
  await page.locator('button[type=submit]').filter({hasText:'Tambah pengeluaran'}).click(); await page.waitForTimeout(2200);
  console.log("saved",n,d, "| dialogs:", await page.locator('[role=dialog]').count());
}
await page.reload(); await page.waitForTimeout(1500);
console.log(await txt(page,600));
await b.close();
