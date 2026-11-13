import { open, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await page.goto("http://localhost:3100/savings"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2000);
const snap=async(l)=>{ await page.waitForTimeout(1500); console.log(l, await page.evaluate(()=>{const t=document.body.innerText.replace(/\n+/g,' | '); return t.slice(t.indexOf('Tabungan Pokok'), t.indexOf('Tabungan Pokok')+170)+' ... '+t.slice(t.indexOf('Sisa Anggaran Mingguan'),t.indexOf('Sisa Anggaran Mingguan')+230)+' ... '+t.slice(t.indexOf('Target Tabungan |'),t.indexOf('Target Tabungan |')+210)+' ... '+t.slice(t.indexOf('Total Masuk'),t.indexOf('Total Masuk')+60);})); };
const dlgInputs=()=>page.locator('[role=dialog]').last();
// fix goal target
await page.getByRole('button',{name:/Ubah Target Tabungan/}).click(); await page.waitForTimeout(600);
const n=dlgInputs().locator('input[type=number]'); console.log("edit dialog target value:", await n.inputValue()); await n.fill("2000000");
await dlgInputs().getByRole('button',{name:/Simpan/}).click(); await snap("T1 goal fixed:");
// deposit
await page.getByRole('button',{name:'Catat setor atau tarik'}).click(); await page.waitForTimeout(600);
await dlgInputs().locator('input[type=number]').fill("150000"); await dlgInputs().locator('input[type=text]').fill("[A002] setoran awal");
const posts=[]; page.on('request',r=>{if(r.method()==='POST')posts.push(1)});
await dlgInputs().getByRole('button',{name:'Simpan'}).dblclick(); await snap("T2 deposit 150.000 (dblclick) POSTs="+posts.length+":");
// move budget leftover
await page.getByRole('button',{name:'Pindahkan ke tabungan'}).click(); await page.waitForTimeout(600);
await dlgInputs().locator('input[type=number]').fill("100000");
await shot(page,"D","S09-move-dialog-100k");
await dlgInputs().getByRole('button',{name:'Pindahkan'}).click(); await snap("T3 moved 100.000:");
await shot(page,"D","S10-after-move",{fullPage:true});
await b.close();
