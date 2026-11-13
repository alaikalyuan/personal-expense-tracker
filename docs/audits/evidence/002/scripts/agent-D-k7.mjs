import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
for (const nm of ["Dompet Utama","\[A002\] Saku Kos","Tabungan"]) {
  await page.getByRole('button',{name:/Saku|Dompet|Tabungan/}).filter({hasText:/Semua Saku|Dompet Utama|Saku Kos|Tabungan/}).first().click().catch(()=>{}); await page.waitForTimeout(500);
  await page.getByRole('button',{name:new RegExp(nm)}).first().click().catch(e=>console.log("click err",nm)); await page.waitForTimeout(1800);
  console.log("VIEW",nm,":", await txt(page,520));
}
await shot(page,"D","K07-saku-tabungan-view");
await b.close();
