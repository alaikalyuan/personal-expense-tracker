import { launch, newContext, login, overflow, BASE, OUT } from "./lib.mjs";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
export { launch, newContext, login, overflow, BASE, OUT };
export const DATA = join(OUT, "C-data"); mkdirSync(DATA, { recursive: true });
export const SHOTS = join(OUT, "shots", "C"); mkdirSync(SHOTS, { recursive: true });
export const VPS = { "320x640":[320,640], "375x812":[375,812], "430x932":[430,932], "768x1024":[768,1024], "1024x768":[1024,768], "1024x1366":[1024,1366], "1280x800":[1280,800], "1440x900":[1440,900] };
export const SPLIT_ID = "49b6b834-5267-4822-82bb-f654d1045ee3";
export function slug(r){ return r==="/"?"home":r.replace(/^\//,"").replace(/[\/?=]/g,"-").replace(/[0-9a-f]{8}-[0-9a-f-]{27}/,"ID"); }
export async function stateFor(browser, role) {
  const f = join(DATA, `state-${role}.json`);
  const ctx = await newContext(browser, {});
  const page = await ctx.newPage();
  await login(page, role);
  await ctx.storageState({ path: f });
  await ctx.close();
  return f;
}
export async function ctxWith(browser, state, vp, theme, extra={}) {
  const [w,h] = VPS[vp] || vp;
  const opts = { viewport:{width:w,height:h}, colorScheme: theme, ...extra };
  if (state) opts.storageState = state;
  const ctx = await browser.newContext(opts);
  await ctx.addCookies([{ name:"THEME", value: theme, url: BASE }, ...(extra.cookies||[])]);
  return ctx;
}
// bottom check: scroll to bottom, compare lowest non-fixed content bottom to fixed bottom bar top
export async function bottomCheck(page) {
  return page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r=>setTimeout(r,300));
    const vh = window.innerHeight;
    let navTop = vh;
    const fixed = [...document.querySelectorAll("body *")].filter(e=>{const s=getComputedStyle(e);return s.position==="fixed"&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().bottom>=vh-2&&e.getBoundingClientRect().top>vh/2;});
    for (const f of fixed){ const r=f.getBoundingClientRect(); if(r.height>0 && r.top<navTop) navTop=r.top; }
    let last = 0, lastEl="";
    for (const e of document.querySelectorAll("main *, body > * *")) {
      const s=getComputedStyle(e); if(s.position==="fixed"||s.visibility==="hidden"||s.display==="none") continue;
      if (fixed.some(f=>f.contains(e))) continue;
      const r=e.getBoundingClientRect(); if(r.width<2||r.height<2) continue;
      const hasText = [...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!(hasText||["BUTTON","A","INPUT","IMG","SVG"].includes(e.tagName.toUpperCase()))) continue;
      if (r.bottom>last){ last=r.bottom; lastEl=e.tagName.toLowerCase()+":"+(e.innerText||"").trim().slice(0,30); }
    }
    return { atBottom: Math.abs(window.scrollY+vh-document.documentElement.scrollHeight)<3, navTop:Math.round(navTop), lastContentBottom:Math.round(last), lastEl, gap:Math.round(navTop-last), docH:document.documentElement.scrollHeight, fixedCount:fixed.length };
  });
}
export const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
export function save(name, obj){ writeFileSync(join(DATA,name), JSON.stringify(obj,null,1)); }
