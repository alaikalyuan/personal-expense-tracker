// Creates the Audit 002 test accounts through the app's own sign-up dialog on localhost.
// Credentials are written to ../secrets/creds.json (scratchpad only) and never printed.
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const secretsDir = join(here, "..", "secrets");
mkdirSync(secretsDir, { recursive: true });
const credsPath = join(secretsDir, "creds.json");
const creds = existsSync(credsPath) ? JSON.parse(readFileSync(credsPath, "utf8")) : {};
const BASE = "http://localhost:3100";
const roles = ["empty", "typical", "large", "journey"];

const browser = await chromium.launch();
for (const role of roles) {
  if (creds[role]?.ok) { console.log(role, "already ok"); continue; }
  const email = `audit002-${role}@sakutrack.test`;
  const password = "A002-" + randomBytes(12).toString("base64url");
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?auth=login`);
  await page.getByRole("button", { name: "Buat Akun" }).first().click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(6000);
  const cookies = await ctx.cookies();
  const authed = cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  const bodyText = (await page.locator("body").innerText()).slice(0, 300).replace(/\s+/g, " ");
  creds[role] = { email, password, ok: authed };
  console.log(role, "signedIn=", authed, "| url=", page.url().replace(/error=[^&]*/, "error=…"), "| text:", bodyText.slice(0, 160));
  await ctx.close();
}
writeFileSync(credsPath, JSON.stringify(creds, null, 2));
await browser.close();
