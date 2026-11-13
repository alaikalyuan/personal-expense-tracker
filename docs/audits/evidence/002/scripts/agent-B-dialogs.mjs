import { launch, newContext, login, axe, shot, BASE, OUT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const SPLIT = "49b6b834-5267-4822-82bb-f654d1045ee3";
const theme = process.argv[2] || "light";
const only = process.argv[3];
const b = await launch();
const ctx = await newContext(b, { theme, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await login(page, "typical");
const results = [];

const inspectJS = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
  const name = (e) => {
    if (!e) return "";
    const al = e.getAttribute("aria-label"); if (al) return al;
    const lb = e.getAttribute("aria-labelledby"); if (lb) return lb.split(/\s+/).map((i) => document.getElementById(i)?.innerText?.trim()).join(" ");
    return "";
  };
  const ds = [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].filter(vis);
  return { n: ds.length, dialogs: ds.map((d) => ({ role: d.getAttribute("role"), modal: d.getAttribute("aria-modal"), name: name(d).slice(0, 60) })) };
};

const active = () => page.evaluate(() => {
  const a = document.activeElement;
  const d = [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop();
  return { tag: a.tagName.toLowerCase(), label: (a.getAttribute("aria-label") || a.innerText || a.placeholder || a.name || "").trim().replace(/\s+/g, " ").slice(0, 40), type: a.type || "", inDialog: d ? d.contains(a) : null, isBody: a === document.body, inv: a.hasAttribute("data-b-inv") };
});

async function testDialog(name, goto, getInvoker, opts = {}) {
  if (only && !name.includes(only)) return;
  const out = { name, theme };
  try {
    await page.goto(BASE + goto); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(500);
    const inv = getInvoker(page);
    await inv.scrollIntoViewIfNeeded().catch(() => {});
    await inv.focus();
    await inv.evaluate((e) => e.setAttribute("data-b-inv", "1"));
    out.invoker = await inv.evaluate((e) => (e.getAttribute("aria-label") || e.innerText || e.title || "").trim().slice(0, 40));
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);
    if (opts.after) { await opts.after(page); await page.waitForTimeout(500); }
    out.dlg = await page.evaluate(inspectJS);
    out.initial = await active();
    out.fields = await page.evaluate(() => {
      const d = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop() || document.body;
      const nm = (e) => { const al = e.getAttribute("aria-label"); if (al) return al; const lb = e.getAttribute("aria-labelledby"); if (lb) return lb.split(/\s+/).map((i) => document.getElementById(i)?.innerText?.trim()).join(" "); if (e.labels && e.labels.length) return [...e.labels].map((l) => l.innerText.trim()).join(" "); return ""; };
      return [...d.querySelectorAll("input:not([type=hidden]),select,textarea")].filter((e) => e.getBoundingClientRect().width > 0 || e.type === "checkbox" || e.type === "file").map((e) => ({ tag: e.tagName.toLowerCase(), type: e.type, name: nm(e).slice(0, 40), ph: (e.placeholder || "").slice(0, 30), title: e.title || "", req: e.required || e.getAttribute("aria-required") === "true", invalid: e.getAttribute("aria-invalid") || "" }));
    });
    out.buttonsNoName = await page.evaluate(() => {
      const d = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop() || document.body;
      return [...d.querySelectorAll("button,a[href]")].filter((e) => e.getBoundingClientRect().width > 0 && !(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || (e.innerText || "").trim())).map((e) => ({ title: e.title || "", html: e.outerHTML.replace(/<svg.*<\/svg>/s, "<svg/>").slice(0, 120) }));
    });
    out.closeBtns = await page.evaluate(() => {
      const d = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop();
      if (!d) return null;
      return [...d.querySelectorAll("button")].filter((e) => e.querySelector("svg.lucide-x") || /tutup|close|batal/i.test(e.getAttribute("aria-label") || e.innerText || "")).map((e) => ({ name: (e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) }));
    });
    out.bg = await page.evaluate(() => {
      const d = [...document.querySelectorAll("[role=dialog]")].filter((e) => e.getBoundingClientRect().width > 0).pop();
      if (!d) return null;
      const attrs = [];
      for (const el of document.body.children) attrs.push(`${el.tagName.toLowerCase()}${el.contains(d) ? "(contains dialog)" : ""}:ariaHidden=${el.getAttribute("aria-hidden")},inert=${el.hasAttribute("inert")}`);
      const main = document.querySelector("main");
      return { bodyChildren: attrs.slice(0, 12), mainInertOrHidden: main ? main.closest("[inert],[aria-hidden=true]") !== null : null, bodyOverflow: document.body.style.overflow };
    });
    await shot(page, "B", `dlg-${name}-${theme}`);
    const ax = await axe(page);
    out.axe = ax.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.count, nodes: v.nodes.slice(0, 2).map((n) => n.target.slice(0, 90) + " :: " + n.summary.replace(/\n/g, " ").slice(0, 140)) }));
    const fw = []; for (let i = 0; i < 30; i++) { await page.keyboard.press("Tab"); fw.push(await active()); }
    out.tabFwdLeaks = fw.filter((a) => a.inDialog === false || a.isBody).length;
    out.tabFwdLeakSample = fw.filter((a) => a.inDialog === false || a.isBody).slice(0, 2);
    out.tabFwdUnique = new Set(fw.map((a) => a.tag + a.label)).size;
    const bw = []; for (let i = 0; i < 30; i++) { await page.keyboard.press("Shift+Tab"); bw.push(await active()); }
    out.tabBackLeaks = bw.filter((a) => a.inDialog === false || a.isBody).length;
    out.tabBackLeakSample = bw.filter((a) => a.inDialog === false || a.isBody).slice(0, 2);
    await page.keyboard.press("Escape"); await page.waitForTimeout(700);
    out.afterEsc = await page.evaluate(inspectJS);
    out.focusAfterEsc = await active();
    out.escapeClosed = out.afterEsc.n === 0;
  } catch (e) { out.error = String(e).slice(0, 200); }
  console.log(JSON.stringify(out));
  results.push(out);
}
const R = (name) => (p) => p.getByRole("button", { name });
const tab = (n) => async (p) => { await p.getByRole("button", { name: n, exact: true }).click(); };

await testDialog("account-menu", "/", R("Buka menu"));
await testDialog("add-quick", "/", R("Tambah pengeluaran"));
await testDialog("add-standard", "/", R("Tambah pengeluaran"), { after: tab("Standar") });
await testDialog("add-photo", "/", R("Tambah pengeluaran"), { after: tab("Upload Foto") });
await testDialog("edit-expense", "/", R("Ubah [A002] Nasi padang"));
await testDialog("ai-sheet", "/", R("Asisten Keuangan AI"));
await testDialog("export-share", "/", R("Bagikan / Ekspor"));
await testDialog("streak", "/", (p) => p.getByRole("button", { name: /Hari$/ }).first());
await testDialog("savings-goal-create", "/savings", R("Tambah Target Baru"));
await testDialog("savings-goal-edit", "/savings", R(/Ubah Target Tabungan: \[A002\] Laptop/));
await testDialog("savings-allocate", "/savings", R("Isi target"));
await testDialog("savings-withdraw-goal", "/savings", R("Ambil dari target"));
await testDialog("savings-move", "/savings", R("Pindahkan ke tabungan"));
await testDialog("savings-balance", "/savings", R("Catat setor atau tarik"));
await testDialog("saku-create", "/saku", R("Tambah Saku"));
await testDialog("saku-edit", "/saku", R(/Ubah Saku: \[A002\] Saku Kos/));
await testDialog("saku-transfer", "/saku", R("Transfer Saku"));
await testDialog("saku-income", "/saku", R("Catat Pemasukan"));
await testDialog("sub-add", "/subscriptions", R("Tambah"));
await testDialog("sub-edit", "/subscriptions", (p) => p.locator('button[title="Edit"]').first());
await testDialog("split-qr", "/split/" + SPLIT, R("Kode QR"));
writeFileSync(OUT + `/B-dialogs-${theme}${only ? "-" + only : ""}.json`, JSON.stringify(results, null, 1));
await b.close();
