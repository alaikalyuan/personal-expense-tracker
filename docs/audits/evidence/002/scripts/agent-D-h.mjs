import { launch, newContext, shot, BASE } from "./lib.mjs";
export { shot, BASE };
export async function open(role="journey", opts={}) {
  const b = await launch();
  const ctx = await newContext(b, {storageState: `../out/_D_${role}_state.json`, ...opts});
  const page = await ctx.newPage();
  return {b, ctx, page};
}
export async function goHome(page){ await page.goto(BASE); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500); }
export const txt = (page, n=1500)=>page.evaluate((n)=>document.body.innerText.slice(0,n).replace(/\n+/g,' | '),n);
export async function openAdd(page){ await page.getByRole('button',{name:'Tambah pengeluaran'}).first().click(); await page.waitForTimeout(700); }
export async function preview(page){ return page.evaluate(()=>{const t=document.body.innerText; const i=t.indexOf('Terdeteksi'); return t.slice(i,i+260).replace(/\n+/g,' | ')}); }
