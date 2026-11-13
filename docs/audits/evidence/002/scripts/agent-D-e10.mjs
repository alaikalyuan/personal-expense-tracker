import { launch, newContext, shot, BASE } from "./lib.mjs";
import { readFileSync } from "node:fs";
const url = readFileSync("../out/_D_split_url.txt","utf8").trim();
const b = await launch();
for (const mode of ["granted","denied"]) {
  const ctx = await newContext(b, {});
  if(mode==="granted") await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const page = await ctx.newPage();
  const logs=[]; page.on('console',m=>{ if(['error','warning'].includes(m.type())) logs.push(m.text().slice(0,160)); });
  await page.goto(url); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
  if(mode==="denied") await page.evaluate(()=>{ navigator.clipboard.writeText = ()=>Promise.reject(new DOMException('denied','NotAllowedError')); });
  for (const label of ["Salin Link","Salin No"]) {
    await page.getByRole('button',{name:label}).click(); await page.waitForTimeout(500);
    const t = await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,420));
    console.log(`[${mode}] click ${label}:`, t.match(/(Tersalin|Disalin|Berhasil|Gagal|Copied|Failed|Link disalin|Tersalin!)[^|]*/i)?.[0] || '(no feedback text found)');
    await shot(page,"D",`E11-copy-${mode}-${label.replace(' ','')}`,{clip:{x:0,y:0,width:375,height:812}});
  }
  if(mode==="granted") console.log("clipboard now:", await page.evaluate(()=>navigator.clipboard.readText().catch(e=>'ERR '+e.name)));
  console.log("console warnings:", logs);
  await ctx.close();
}
await b.close();
