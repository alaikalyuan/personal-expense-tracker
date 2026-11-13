import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await goHome(page);
const list = ()=>page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Entri Terbaru'); const j=t.indexOf('Rata-rata Harian'); return t.slice(i,j>0?j:i+600).replace(/\n+/g,' | ')});
console.log("WEEKLY default:", await list());
await page.getByRole('button',{name:'Bulanan',exact:true}).click(); await page.waitForTimeout(1500);
console.log("BULANAN:", await txt(page,500));
console.log("BULANAN list:", await list());
await page.getByRole('button',{name:'Cari pengeluaran'}).click(); await page.waitForTimeout(500);
const inp=page.locator('input[type=search]').first();
for (const q of ["buku","bensin","bioskop","lunch","sarapan","xyz-none"]) { await inp.fill(q); await page.waitForTimeout(600); console.log("[Bulanan] search",q,"=>",await list()); if(q==="buku") await shot(page,"D","C05-search-monthly-buku"); if(q==="bioskop") await shot(page,"D","C06-search-monthly-bioskop"); if(q==="xyz-none") await shot(page,"D","C07-search-none"); }
await page.getByText('Reset filter').click().catch(()=>console.log("no reset btn")); await page.waitForTimeout(500);
console.log("after reset:", await list());
// back to weekly, tabs
await page.getByRole('button',{name:'Mingguan',exact:true}).click(); await page.waitForTimeout(1200);
await page.getByRole('button',{name:/Minggu Ini/}).click(); await page.waitForTimeout(600);
console.log("weekly Minggu Ini list:", await list());
await b.close();
