import { launch, newContext, shot, BASE } from "./lib.mjs";
const b = await launch(); const ctx = await newContext(b, {}); const page = await ctx.newPage();
await page.goto(BASE+"/?auth=login"); await page.waitForTimeout(1500);
console.log("fields:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog] input')].map(i=>i.type+':'+i.autocomplete+':'+i.placeholder+':req='+i.required+':label='+(i.labels?.[0]?.innerText||'')).join(' ; ')));
console.log("forgot link:", await page.getByText(/lupa|forgot/i).count(), "| show pw toggle:", await page.locator('[role=dialog] button[aria-label*="ata sandi" i], [role=dialog] button[aria-label*="assword" i]').count());
await page.locator('input[type=email]').fill("audit002-nonexistent@example.invalid"); await page.locator('input[type=password]').fill("wrong-pass-123");
await page.locator('[role=dialog] button[type=submit]').click(); await page.waitForTimeout(2500);
console.log("ERR:", await page.evaluate(()=>[...document.querySelectorAll('[role=dialog]')].map(d=>d.innerText.replace(/\n+/g,' | ')).join('').slice(0,400)));
await shot(page,"D","AU01-login-error");
// invalid email format / short password signup
await page.getByText('Buat akun',{exact:false}).first().click().catch(()=>{}); await page.waitForTimeout(500);
await page.locator('input[type=email]').fill("not-an-email"); await page.locator('input[type=password]').fill("123");
await page.locator('[role=dialog] button[type=submit]').click(); await page.waitForTimeout(1200);
console.log("SIGNUP invalid validation msg:", await page.locator('input[type=email]').evaluate(e=>e.validationMessage));
console.log("auth cookie:", (await ctx.cookies()).filter(k=>k.name.includes('auth')).length);
await b.close();
