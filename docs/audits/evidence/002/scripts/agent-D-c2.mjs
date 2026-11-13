import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
const sres = async (q, label) => { 
  const inp = page.locator('input[type=search], input[placeholder*="Cari"]').first();
  if(!(await inp.count())||!(await inp.isVisible().catch(()=>false))) { await page.getByRole('button',{name:'Cari pengeluaran'}).click(); await page.waitForTimeout(500); }
  const i2 = page.locator('input[type=search], input[placeholder*="Cari"]').first();
  await i2.fill(q); await page.waitForTimeout(700);
  const t = await page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Entri Terbaru'); return t.slice(i,i+520).replace(/\n+/g,' | ')});
  console.log(label, JSON.stringify(q), "=>", t);
};
await page.getByRole('button',{name:'Cari pengeluaran'}).click(); await page.waitForTimeout(600);
console.log(await page.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.type+'|ph='+i.placeholder+'|aria='+i.getAttribute('aria-label')).join(' ; ')));
await shot(page,"D","C02-search-open");
await sres("sarapan","[weekly view, tab Hari Ini?]");
await shot(page,"D","C03-search-sarapan");
await page.getByRole('button',{name:/Minggu Ini/}).click(); await page.waitForTimeout(500); await sres("sarapan","[Minggu Ini]");
await shot(page,"D","C04-search-week-sarapan");
await sres("buku","[Minggu Ini] (5 Nov, last week)");
await page.getByRole('button',{name:'Bulanan',exact:true}).click(); await page.waitForTimeout(1500);
console.log("BULANAN HEADER:", await txt(page,350));
await sres("buku","[Bulanan]"); await shot(page,"D","C05-search-monthly-buku");
await sres("bioskop","[Bulanan] (20 Oct)");
await sres("lunch","[Bulanan]");
await shot(page,"D","C06-search-monthly-lunch");
const rf = await page.getByText(/Reset filter|Hapus filter|Reset/i).count(); console.log("reset controls:",rf);
await b.close();
