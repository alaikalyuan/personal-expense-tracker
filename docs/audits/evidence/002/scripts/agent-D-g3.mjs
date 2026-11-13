import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, ctx, page} = await open("journey");
let block=false, blocked=0, blockRsc=false, rscBlocked=0;
await page.route('**/*', route=>{ const r=route.request(); const h=r.headers();
  if(block && r.method()==='POST' && h['next-action']){ blocked++; return route.abort('failed'); }
  if(blockRsc && (h['rsc']==='1') && /\/split(\?|$)/.test(r.url())){ rscBlocked++; return route.abort('failed'); }
  return route.continue(); });
// ---- subscription edit offline-ish
await page.goto("http://localhost:3100/subscriptions"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Edit'}).click(); await page.waitForTimeout(600);
await page.locator('input[type=number]').first().fill("36990");
block=true; await page.getByRole('button',{name:/Simpan|Perbarui|Update/}).last().click();
for (const w of [800,2500]) { await page.waitForTimeout(w); console.log("SUB aborted t+"+w,"blocked="+blocked,"| dialog open:", await page.locator('[role=dialog]').count(), "|", await page.evaluate(()=>{const t=document.body.innerText.replace(/\n+/g,' | '); return (t.match(/(Failed|Gagal|Terjadi kesalahan)[^|]*/g)||['(no error text)']).join(' ## ')}), "| price input:", await page.locator('input[type=number]').first().inputValue().catch(()=>'gone')); }
await shot(page,"D","G05-sub-aborted");
block=false;
await page.getByRole('button',{name:/Simpan|Perbarui|Update/}).last().click().catch(()=>{}); await page.waitForTimeout(2500);
await page.reload(); await page.waitForTimeout(1500);
console.log("sub price after retry:", (await txt(page,600)).match(/Rp 3\d\.\d{3} \| \/Bulan/)?.[0], "| sub count:", await page.getByText('[A002] Spotify uji').count());
// ---- /split RSC fetch failure
await goHome(page);
blockRsc=true;
await page.getByRole('link',{name:'Patungan'}).first().click(); await page.waitForTimeout(3500);
console.log("NAV to /split with RSC aborted: url=", page.url(), "rscBlocked=", rscBlocked); console.log(await txt(page,500));
await shot(page,"D","G06-split-rsc-aborted");
await b.close();
