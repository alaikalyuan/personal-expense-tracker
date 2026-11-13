import * as c from "./agent-C-common.mjs";
import { readFileSync } from "node:fs";
const wallet = JSON.parse(readFileSync(c.DATA+"/wallets.json"))[0];
const b = await c.launch(); const res={};
await c.stateFor(b,"typical");
for (const loc of ["id","en"]) {
  const ctx = await c.ctxWith(b, c.DATA+"/state-typical.json", "375x812", "light", { cookies:[{name:"NEXT_LOCALE",value:loc,url:c.BASE}] });
  const p = await ctx.newPage();
  for (const r of ["/","/savings","/saku",wallet,"/subscriptions","/split","/split/new","/split/"+c.SPLIT_ID,"/compare","/archive","/does-not-exist"]) {
    await p.goto(c.BASE+r); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(600);
    const k=loc+" "+r.replace(wallet,"/saku/WALLET"); res[k]=await p.evaluate(()=>document.body.innerText);
    if (loc==="en" && ["/","/split","/subscriptions"].includes(r)) await p.screenshot({path:`${c.SHOTS}/${c.slug(r)}__375x812__light__lang-en.png`,fullPage:true});
  }
  // dialogs on home
  const dl = {
    menu: async()=>{ await p.getByRole("button",{name:/menu/i}).first().click(); },
    addexp: async()=>{ await p.locator('nav button').nth(0).click().catch(()=>{}); },
  };
  await p.goto(c.BASE+"/"); await p.waitForLoadState("networkidle").catch(()=>{}); await c.sleep(500);
  await p.locator('header button, main button').filter({has:p.locator("svg.lucide-menu")}).first().click().catch(async()=>{await p.getByRole("button",{name:loc==="id"?"Buka menu":"Open menu"}).click()}); await c.sleep(600);
  res[loc+" DIALOG menu"]=await p.evaluate(()=>([...document.querySelectorAll("[role=dialog]")].pop()||{}).innerText||"NONE");
  await p.keyboard.press("Escape"); await c.sleep(400);
  const addName = loc==="id"?"Tambah pengeluaran":"Add expense";
  await p.locator("nav").getByRole("button").filter({has:p.locator("svg")}).nth(0).click().catch(()=>{});
  await p.locator('button[aria-label]').filter({hasText:""}).evaluateAll(els=>{const a=els.find(e=>/tambah|add/i.test(e.getAttribute("aria-label")));a&&a.click()}).catch(()=>{}); await c.sleep(900);
  res[loc+" DIALOG addexp"]=await p.evaluate(()=>([...document.querySelectorAll("[role=dialog]")].pop()||{}).innerText||"NONE");
  await p.keyboard.press("Escape"); await c.sleep(400);
  await ctx.close();
}
c.save("i18n-text.json",res);
console.log(Object.keys(res).map(k=>k+":"+res[k].length).join("\n"));
await b.close();
