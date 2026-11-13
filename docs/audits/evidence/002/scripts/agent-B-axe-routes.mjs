import { launch, newContext, login, axe, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const SPLIT="49b6b834-5267-4822-82bb-f654d1045ee3";
const b = await launch();
const res = [];
async function run(label, page, url, theme, extra) {
  try {
    await page.goto(BASE + url, { waitUntil: "load" }); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
    if (extra) await extra(page);
    const meta = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, h1: [...document.querySelectorAll("h1")].map(h=>h.innerText.trim().slice(0,50)), h: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h=>h.tagName[1]).join(""), landmarks: [...document.querySelectorAll("main,nav,header,footer,[role=main],[role=navigation],[role=banner],aside")].map(e=>e.tagName.toLowerCase()+(e.getAttribute("aria-label")?`[${e.getAttribute("aria-label")}]`:"")) }));
    const r = await axe(page);
    res.push({ label, url, theme, meta, violations: r.violations, incomplete: r.incomplete.map(i=>({id:i.id,count:i.count})) });
    console.log(label, url, theme, "viol:", r.violations.map(v=>`${v.id}(${v.impact},${v.count})`).join(" ")||"none");
  } catch (e) { res.push({ label, url, theme, error: String(e).slice(0,200) }); console.log("ERR", label, url, String(e).slice(0,120)); }
}
for (const theme of ["light","dark"]) {
  // signed-out
  let ctx = await newContext(b, { theme, hasTouch:true, isMobile:true });
  let page = await ctx.newPage();
  await run("out","" + page, "/", theme).catch(()=>{});
  res.pop();
  await run("signed-out", page, "/", theme);
  await run("signed-out", page, "/?auth=login", theme);
  await run("signed-out friend", page, "/split/"+SPLIT, theme);
  await run("signed-out", page, "/does-not-exist", theme);
  await run("signed-out", page, "/split", theme);
  await ctx.close();
  // typical
  ctx = await newContext(b, { theme, hasTouch:true, isMobile:true });
  page = await ctx.newPage();
  await login(page, "typical");
  await page.goto(BASE+"/saku"); await page.waitForLoadState("networkidle");
  const wid = await page.evaluate(()=>[...document.querySelectorAll('a[href^="/saku/"]')].map(a=>a.getAttribute('href'))[0]);
  for (const u of ["/","/savings","/saku",wid,"/subscriptions","/split","/split/new","/split/"+SPLIT,"/split/"+SPLIT+"/edit","/compare","/archive","/does-not-exist"]) await run("typical", page, u, theme);
  await ctx.close();
  // empty
  ctx = await newContext(b, { theme, hasTouch:true, isMobile:true });
  page = await ctx.newPage();
  await login(page, "empty");
  for (const u of ["/","/savings","/saku","/subscriptions","/split","/compare","/archive"]) await run("empty", page, u, theme);
  await ctx.close();
}
writeFileSync(OUT + "/B-axe-routes.json", JSON.stringify(res, null, 1));
await b.close();
