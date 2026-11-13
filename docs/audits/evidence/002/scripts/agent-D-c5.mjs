import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open();
await page.goto("http://localhost:3100/archive"); await page.waitForTimeout(2000);
const i=page.locator('input[placeholder="Cari riwayat pengeluaran..."]');
for (const q of ["bioskop","buku","lunch","zzz"]) { await i.fill(q); await page.waitForTimeout(700); console.log(q,"=>",await txt(page,700)); }
await shot(page,"D","C09-archive-search-zzz");
await i.fill("bioskop"); await page.waitForTimeout(500); await shot(page,"D","C10-archive-bioskop");
await b.close();
