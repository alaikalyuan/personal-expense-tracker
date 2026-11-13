import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
await page.getByRole('button',{name:'Buka menu'}).click(); await page.waitForTimeout(600);
await page.getByText('Deteksi Email QRIS').click(); await page.waitForTimeout(1200);
const dl=()=>page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].slice(-1).map(d=>d.innerText.replace(/\n+/g,' | ')).join(''));
await page.locator('[role=dialog]').last().getByText('Pengaturan',{exact:true}).click(); await page.waitForTimeout(800);
console.log("PENGATURAN:", await dl()); await shot(page,"D","EM02-settings-tab");
await page.locator('[role=dialog]').last().getByText('Coba tempel',{exact:true}).click(); await page.waitForTimeout(800);
console.log("COBA TEMPEL:", await dl()); await shot(page,"D","EM03-paste-tab");
const ta=page.locator('[role=dialog] textarea').last();
const email=`Pembayaran Berhasil
Anda telah melakukan pembayaran QRIS
Merchant: [A002] WARUNG UJI KOPI
Nominal: Rp 18.500
Tanggal: 13 Nov 2026 02:45 WIB
No. Referensi: A002TEST0001
Sumber dana: Tabungan Livin'`;
await ta.fill(email);
const posts=[]; page.on('request',r=>{if(r.method()==='POST')posts.push(r.url().replace('http://localhost:3100',''))});
await page.getByRole('button',{name:/Baca|Parse|Periksa|Cek|Coba|Proses|Analisis/}).last().click().catch(async()=>console.log("btns:",await page.evaluate(()=>[...document.querySelectorAll('[role=dialog] button')].map(b=>b.innerText.trim()))));
await page.waitForTimeout(3500);
console.log("AFTER PARSE:", await dl(), "| POSTs", posts); await shot(page,"D","EM04-parse-result");
await b.close();
