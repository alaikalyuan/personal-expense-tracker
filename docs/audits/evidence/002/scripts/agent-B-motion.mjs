import { launch, newContext, login, BASE } from "./lib.mjs";
const b = await launch();
for (const rm of ["no-preference", "reduce"]) {
  const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true, reducedMotion: rm });
  const page = await ctx.newPage();
  await login(page, "typical");
  const anim = () => page.evaluate(() => ({ mq: matchMedia("(prefers-reduced-motion: reduce)").matches, running: document.getAnimations().map((a) => ({ n: a.animationName || a.transitionProperty || "?", dur: a.effect?.getTiming().duration, iter: a.effect?.getTiming().iterations, tgt: (a.effect?.target?.className || "").toString().slice(0, 40) })).slice(0, 12) }));
  await page.goto(BASE + "/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
  console.log(rm, "dashboard idle:", JSON.stringify(await anim()));
  await page.getByRole("button", { name: "Tambah pengeluaran" }).click(); await page.waitForSelector("[role=dialog]"); await page.waitForTimeout(30);
  console.log(rm, "add dialog opening (60ms):", JSON.stringify(await anim()));
  const d = await page.evaluate(() => { const p = document.querySelector("[role=dialog]"); const cs = getComputedStyle(p.parentElement); const cs2 = getComputedStyle(p); return { overlay: cs.animationName + " " + cs.animationDuration, panel: cs2.animationName + " " + cs2.animationDuration }; });
  console.log(rm, "dialog computed:", JSON.stringify(d));
  await page.keyboard.press("Escape");
  // streak pulse/ping
  await page.getByRole("button", { name: /Hari$/ }).first().click(); await page.waitForTimeout(500);
  console.log(rm, "streak dialog animations:", JSON.stringify(await anim()));
  await page.keyboard.press("Escape");
  await page.goto(BASE + "/savings"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
  console.log(rm, "savings:", JSON.stringify(await anim()), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=progressbar],[class*=transition]")].slice(0, 3).map((e) => getComputedStyle(e).transitionDuration))));
  await ctx.close();
}
await b.close();
