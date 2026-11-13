import { launch, newContext, axe, shot, BASE } from "./lib.mjs";
const b = await launch();
const ctx = await newContext(b, { theme: "light", hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const act = () => page.evaluate(() => { const a = document.activeElement; return `${a.tagName.toLowerCase()}[type=${a.type || ""}] "${(a.getAttribute("aria-label") || a.innerText || a.placeholder || "").trim().replace(/\s+/g, " ").slice(0, 40)}"`; });
const form = (label) => page.evaluate((label) => {
  const nm = (e) => { const al = e.getAttribute("aria-label"); if (al) return "aria-label:" + al; const lb = e.getAttribute("aria-labelledby"); if (lb) return "labelledby:" + lb; if (e.labels && e.labels.length) return "label:" + [...e.labels].map((l) => l.innerText.trim()).join(" "); return "NONE"; };
  const d = document.querySelector("[role=dialog]") || document;
  return {
    label,
    dialog: d.getAttribute && { role: d.getAttribute("role"), name: d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"), headings: [...d.querySelectorAll("h1,h2,h3")].map((h) => h.tagName + ":" + h.innerText) },
    inputs: [...d.querySelectorAll("input,select,textarea")].map((e) => ({ type: e.type, name: nm(e), ph: e.placeholder, required: e.required, aria_required: e.getAttribute("aria-required"), autocomplete: e.autocomplete, invalid: e.getAttribute("aria-invalid"), describedby: e.getAttribute("aria-describedby") })),
    buttons: [...d.querySelectorAll("button,a[href]")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => ({ tag: e.tagName, type: e.type, text: (e.innerText || "").trim().slice(0, 30), aria: e.getAttribute("aria-label"), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), html: (e.innerText || e.getAttribute("aria-label")) ? "" : e.outerHTML.replace(/<svg.*<\/svg>/s, "<svg/>").slice(0, 160) })),
    liveRegions: [...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map((e) => e.getAttribute("role") + "/" + e.getAttribute("aria-live") + ":" + (e.innerText || "").slice(0, 40)),
  };
}, label);

await page.goto(BASE + "/"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
await shot(page, "B", "auth-0-landing");
console.log("LANDING activeElement:", await act());
console.log(JSON.stringify(await form("landing")));
// keyboard to login
const seq = [];
for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); seq.push(await act()); }
console.log("landing tab seq:", JSON.stringify(seq));
await page.goto(BASE + "/?auth=login"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
console.log("LOGIN activeElement:", await act());
console.log(JSON.stringify(await form("login-masuk")));
await shot(page, "B", "auth-1-login");
const seq2 = [];
for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); seq2.push(await act()); }
console.log("login tab seq:", JSON.stringify(seq2));
// find tab/mode switch
console.log("switch candidates:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button, [role=dialog] a, [role=dialog] [role=tab]")].map((e) => (e.getAttribute("role") || e.tagName) + ":" + (e.innerText || "").trim().slice(0, 30) + ":sel=" + e.getAttribute("aria-selected") + ":pressed=" + e.getAttribute("aria-pressed")))));
// switch to Buat Akun
const reg = page.getByRole("button", { name: /Buat Akun|Daftar/i }).first();
await reg.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("after switch active:", await act());
console.log(JSON.stringify(await form("login-buat-akun")));
await shot(page, "B", "auth-2-register");
const ax = await axe(page);
console.log("AXE register mode:", JSON.stringify(ax.violations.map((v) => `${v.id}:${v.impact}:${v.count}`)));
// client-side validation: type invalid email, press Enter
const email = page.locator('input[type="email"]');
await email.fill("notanemail");
await page.locator('input[type="password"]').fill("x");
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("invalid email submit -> url:", page.url(), "validationMessage:", await email.evaluate((e) => e.validationMessage), "aria-invalid:", await email.getAttribute("aria-invalid"), "active:", await act());
console.log("alerts after:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map((e) => e.getAttribute("role") + ":" + e.innerText.slice(0, 80)))));
// back to Masuk and try nonexistent user with wrong password (creates nothing)
const login = page.getByRole("button", { name: /^Masuk$/ }).first();
await login.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
await email.fill("audit002-nobody@sakutrack.test");
await page.locator('input[type="password"]').fill("WrongPass-123");
await page.locator('input[type="password"]').press("Enter");
await page.waitForTimeout(2500);
console.log("wrong creds -> url:", page.url(), "active:", await act());
console.log("error markup:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] p, [role=dialog] div")].filter((e) => /gagal|invalid|salah|error|incorrect|credentials/i.test(e.innerText || "") && e.children.length === 0).map((e) => ({ role: e.getAttribute("role"), live: e.getAttribute("aria-live"), text: e.innerText.slice(0, 100), cls: String(e.className).slice(0, 60) })))));
await shot(page, "B", "auth-3-error");
console.log("input state after error:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] input")].map((e) => ({ type: e.type, invalid: e.getAttribute("aria-invalid"), describedby: e.getAttribute("aria-describedby") })))));
// forgot password / show password
console.log("forgot/show-password present:", JSON.stringify(await page.evaluate(() => ({ forgot: /lupa|forgot|reset/i.test(document.body.innerText), showPw: !!document.querySelector('[aria-label*="ampil" i],[aria-label*="show" i],[aria-label*="lihat" i]') }))));
// Escape closes? focus return
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after Escape: dialogs", await page.evaluate(() => document.querySelectorAll("[role=dialog]").length), "url", page.url(), "active", await act());
await b.close();
