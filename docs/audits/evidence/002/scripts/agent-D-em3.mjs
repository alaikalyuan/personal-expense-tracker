import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
await goHome(page);
console.log("DASH:", await txt(page,700)); await shot(page,"D","EM05-pending-banner");
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().height>0&&/Catat|Abaikan|Tolak|Hapus|Tinjau|Konfirmasi|Simpan/.test(e.innerText||e.getAttribute('aria-label')||'')).map(e=>(e.innerText||e.getAttribute('aria-label')).trim().slice(0,30)+'@'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))));
await b.close();
