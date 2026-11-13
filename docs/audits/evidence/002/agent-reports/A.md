# Agent A report: Engineering, performance, PWA and Audit 001 code re-check

Repo `a66510c` (master), Next 16.3.4 Turbopack, React 19.2.8. Audit date 2026-11-13. Production server `http://localhost:3100` for all evidence except the dev console pass (`3000`).

## 1. Summary

- Lint: 13 errors / 27 warnings, `tsc` clean, build passes. All 13 lint-error lines were authored 11-12 Oct 2026 (git blame), i.e. before Audit 001; none are introduced by the Warung redesign, although 4 of the 5 error files were touched by it.
- Client JS, all 52 chunks in `.next/static`: 1,937,876 B raw / 571,353 B gzip (Audit 001: 463,942; phase 1: 537,118; phase 2: 565,571). CSS: 140,414 B raw / 19,615 B gzip (Audit 001: 164,470 raw). Signed-out `/` first load: 14 scripts, 1,078,105 raw / 323,389 gzip, of which 112,594 / 39,627 is the `noModule` polyfill chunk that modern browsers do not download.
- The heavy-module findings of Audit 001 are mostly fixed: add-expense modal, AI sheet (react-markdown/remark, 51.6 KB gz chunk), budget dialog, export modal, notification and email-sync modals, and savings confetti are all lazy. Still static: `UpgradeAccountModal` (pulls the Supabase browser client into `/`), `qrcode` and `canvas-confetti` in `SplitBillViewer`.
- Dashboard server work is unchanged since Audit 001 (`app/page.tsx` has no commits after `09d0221`): 3 `auth.getUser` network calls per full-document load, 2 `wallet_balances` reads, the all-time streak query, and about 7 sequential round trips. STILL PRESENT.
- Lab (Lighthouse 13 mobile, simulated throttling, localhost, 3 runs per route): FCP about 1.07 s everywhere, CLS 0 in all 16 runs, TBT 140-400 ms. Signed-in `/`, `/savings`, `/compare` and the `large` account have lab LCP of about 3.0-3.4 s (above the 2.5 s "Good" line); signed-out `/` and the friend view are about 1.1 s. INP and field data: UNVERIFIED.
- PWA: service worker caches only `/offline.html` and serves it on failed navigations. Live cross-account test: no typical data was visible to `empty` or to a signed-out user while offline. PASS on privacy. Offline writes are not queued; they fail with the raw error text (code-level).
- Edit authorization: `empty` opening `/split/<typical bill>/edit` was redirected to the read-only viewer. Creator checks exist in the page and in `updateSplitBill`.
- Console: 0 errors/warnings/failed requests on dev (9 routes plus the account menu) and on prod.
- Audit 001 items 1-53 re-checked (section 6): 26 FIXED, 17 PARTIAL, 5 STILL PRESENT (12, 34, 38, 48, 50), 4 NEEDS-LIVE (5, 6, 43, 44), 1 UNVERIFIED (39); no REGRESSED found. Fixed items rest on code evidence; live confirmation is for the other agents.

## 2. What I ran

All scripts live in `SCRATCH/tools/` (names start `agent-A-`). Node 24.12, Playwright 1.65.0 Chromium (headless 158.0.8127.18), Lighthouse 13.6.0.

| Script / command | Purpose | Auth / viewport / theme |
|---|---|---|
| `agent-A-lint.mjs` (parses `logs/lint.log`), `git log/blame/diff --stat 09d0221..HEAD` | lint summary, provenance | n/a |
| `agent-A-bundle.mjs` | sizes of all `.next/static` JS/CSS (gzip level 6, level 9, brotli), per-route script lists from fetched HTML, `noModule` detection | signed-out, `typical`, `large`; HTML fetched with `context.request` (no render) |
| `agent-A-lh.mjs out|typical|large` | Lighthouse Node API, mobile preset (default simulated 4G + 4x CPU), performance category only, navigation mode, `disableStorageReset:true`, Chrome HTTP cache cleared via CDP `Network.clearBrowserCache` before each run (cookies kept). Playwright `launchPersistentContext` with `--remote-debugging-port` 9222/9223/9224, viewport 412x823 | signed-out, `typical`, `large`; light theme (app default) |
| `agent-A-console.mjs` (`A002_BASE` = 3000 and 3100) | console error/warning, `pageerror`, `requestfailed`, HTTP >= 400 across 9 routes + account menu open | `typical`, 375x812, light |
| `agent-A-pwa.mjs` | SW state, cache contents, manifest, headers, cross-account offline test | `typical` then `empty` then signed out, one context, 375x812, light |
| `agent-A-authz.mjs` | read-only: `/split/<id>/edit` as signed-out / `empty` / `typical`; unauthenticated API probes (empty bodies) | as listed |
| `agent-A-labels.mjs` | static heuristic for unlabeled form controls | n/a |
| ad-hoc `grep`/`sed` over `app/`, `utils/`, `public/`, `supabase/schema.sql` | Audit 001 re-check | n/a |

Raw outputs: `SCRATCH/out/lighthouse/` (`A-*-runN.json` full Lighthouse reports, `A-summary-*.json`, `A-bundle.json`, `A-console-dev|prod.json`, `A-pwa.json`, `A-run-*.log`). Screenshots: `SCRATCH/out/shots/A/`.

Caveats on lab data: other agents were using the same machine and production server while the Lighthouse runs executed, so absolute numbers carry unknown contention noise. The Supabase region latency is not controlled (TTFB of the signed-in pages is 131-227 ms from this machine).

## 3. Coverage table (plan 6.7 and 6.8)

| Item | Static/build evidence | Live evidence | Status |
|---|---|---|---|
| 6.7 production build, not dev | `build.log` exit 0, all routes `ƒ` | prod server 3100 used | PASS |
| 6.7 total JS/CSS | counted from `.next/static` | n/a | PASS (recorded) |
| 6.7 route first-load JS | from HTML of 9 routes x signed-out/typical (+ `large` `/`) | yes | PASS (recorded) |
| 6.7 unnecessary static imports | grep + chunk inspection | n/a | PARTIAL (3 remain) |
| 6.7 modals loaded only when needed | grep for `dynamic`/`import()` | chunk absence in route HTML | PARTIAL |
| 6.7 sequential requests / duplicates | `app/page.tsx` + helpers | not timed per query | FAIL |
| 6.7 images, fonts, large assets | Lighthouse network table, `public/` | yes | PASS |
| 6.7 console errors / React warnings | n/a | dev + prod, 9 routes + menu | PASS (0) |
| 6.7 layout shift during load | n/a | Lighthouse CLS 0 in 16 runs | PASS (lab) |
| 6.7 slow network / CPU throttling | n/a | Lighthouse simulated 4G + 4x CPU slowdown | PARTIAL (simulated only, no real device) |
| 6.7 LCP / INP / CLS | n/a | LCP, CLS lab; INP not measurable | PARTIAL; INP and field data UNVERIFIED |
| 6.7 lab vs field distinction | n/a | stated | PASS |
| 6.8 installable | manifest valid | headless: install prompt not exercised | UNVERIFIED (install flow) |
| 6.8 manifest fields | `/manifest.webmanifest` fetched | yes | PASS |
| 6.8 icons / maskable | PNG headers, visual check | yes | PASS (no screenshots/shortcuts) |
| 6.8 installed experience coherent | n/a | not tested (no installed-app environment) | UNVERIFIED |
| 6.8 offline behavior defined | `sw.js`, `offline.html` | yes | PARTIAL |
| 6.8 essential offline actions | code | Agent D tests live | PARTIAL (explains, cannot queue) |
| 6.8 unsynced data not silently lost | code: no queue; failure keeps form open | Agent D | PARTIAL |
| 6.8 sync/retry states | none exist | n/a | FAIL (no states, by design) |
| 6.8 cache does not expose private data across accounts | `sw.js` caches only offline.html | live 3-account test | PASS |
| 6.8 SW updates consistent | `skipWaiting` + `clients.claim` | not exercised across a version change | PASS in code; UNVERIFIED live |

## 4. Checklist results

### 4.1 Lint, type check, build (plan 6.7 "production build")

- `tsc`: exit 0. `npm run build`: exit 0. `npm run lint`: exit 1, 13 errors, 27 warnings (`logs/lint.log`). The build does not run lint, which is why it still passes. Verified in code/log.
- The 13 errors, by file and rule (line numbers are `lint.log` lines; "blame" is the commit date of that line):

| File | Lines | Rule | Blame |
|---|---|---|---|
| `app/ai/AiAssistantProvider.tsx` | 151 | `react-hooks/set-state-in-effect` | 2026-10-11 |
| `app/ai/AiAssistantProvider.tsx` | 328 | `@typescript-eslint/no-explicit-any` | 2026-10-11 |
| `app/ai/AiAssistantSheet.tsx` | 53, 106 | `react-hooks/set-state-in-effect` x2 | 2026-10-11 |
| `app/ai/ImageUploadModal.tsx` | 63, 120 | `react-hooks/set-state-in-effect` x2 | 2026-10-11 |
| `app/ai/ImageUploadModal.tsx` | 148 | `react-hooks/immutability` (`loadFile` used before declaration) | 2026-10-11 |
| `app/ai/actions.ts` | 57, 199 | `no-explicit-any` x2 | 2026-10-11 |
| `app/email-sync/PendingTransactionsBanner.tsx` | 136, 240 | `no-explicit-any` x2 | 2026-10-12 |
| `app/page.tsx` | 184 | `no-explicit-any` | 2026-10-12 |
| `utils/ai/useImageExtract.ts` | 31 | React Compiler "Compilation Skipped: Existing memoization could not be preserved" | 2026-10-11 |

  By rule: 5 `set-state-in-effect`, 6 `no-explicit-any`, 1 `immutability`, 1 compiler-skip.
- Changed since Audit 001 (`09d0221..HEAD`, 82 files): the files `AiAssistantProvider.tsx`, `AiAssistantSheet.tsx`, `ImageUploadModal.tsx`, `PendingTransactionsBanner.tsx` were touched (Warung `f36b384` / `1879ede`) but the offending lines are older than Audit 001. `ai/actions.ts`, `page.tsx`, `useImageExtract.ts` are unchanged since then. Net: pre-existing debt, no new lint errors traced to the redesign. 22 of the 27 warnings are unused variables/imports; others: 2x `<img>`, 1 `window.location.href`, 1 `exhaustive-deps` (`SplitBillCreator.tsx:428`, new edit-mode code), 1 anonymous default export.

### 4.2 Bundle (plan 6.7)

Method: sizes of every `.js`/`.css` file in `.next/static` (Node zlib gzip level 6; level 9 and brotli also recorded in `A-bundle.json`). Previous gates do not document their gzip level, so differences under about 1% are not meaningful.

| Measure | Audit 001 | Phase 1 gate | Phase 2 gate | Now (Audit 002) |
|---|---|---|---|---|
| All JS, raw | 1,698,821 | 1,958,028 | n/a | 1,937,876 (52 files) |
| All JS, gzip | 463,942 | 537,118 | 565,571 | **571,353** (569,914 at level 9; 494,430 brotli) |
| CSS, raw | 164,470 (1 file) | n/a | n/a | 140,414 (2 files: 138,788 + 1,626) |
| CSS, gzip | n/a | n/a | n/a | 19,615 |
| Signed-out `/` first-load JS | not measured | 1,075,320 raw / 321,697 gz, 14 scripts | n/a | 1,078,105 raw / 323,389 gz, 14 scripts |

Growth 464 KB to 571 KB gzip (+23%) since Audit 001 is still not traced to one cause. The raw total fell slightly since phase 1 while gzip rose; I did not investigate why (UNVERIFIED).

Route first-load JS (`<script src>` and preload scripts in the server-rendered HTML; includes the 112,594 B raw / 39,627 B gz `noModule` polyfill chunk `0cz1d0mv5g_q7.js`, which modern browsers skip; subtract it for a modern-browser figure). CSS is the same two files on every route (140,414 raw / 19,615 gz).

| Route | Auth | Scripts | Raw | Gzip | Gzip without polyfill |
|---|---|---|---|---|---|
| `/` | signed-out | 14 | 1,078,105 | 323,389 | 283,762 |
| `/` | typical | 14 | 1,078,105 | 323,389 | 283,762 |
| `/` | large | 14 | 1,078,105 | 323,389 | 283,762 |
| `/savings` | typical | 13 | 767,737 | 237,705 | 198,078 |
| `/saku` | typical | 13 | 752,212 | 233,772 | 194,145 |
| `/subscriptions` | typical | 12 | 744,350 | 232,750 | 193,123 |
| `/split` | typical | 12 | 727,290 | 229,484 | 189,857 |
| `/split/new` | typical | 14 | 794,380 | 244,869 | 205,242 |
| `/split/49b6b834...` (viewer) | typical and signed-out | 13 | 762,622 | 242,684 | 203,057 |
| `/compare` | typical | 12 | 732,538 | 230,391 | 190,764 |
| `/archive` | typical | 13 | 740,930 | 234,249 | 194,622 |

Signed-out requests to `/savings`, `/saku`, `/subscriptions`, `/split`, `/split/new`, `/compare`, `/archive` return 307 to `/?next=...` (no scripts).

Largest chunks (raw / gzip) and contents (identified by string signatures; Turbopack names are hashes):

| Chunk | Raw | Gzip | Contents | In first load of |
|---|---|---|---|---|
| `329bi_ny3rs1z.js` | 335,839 | 88,929 | `@supabase` browser client (GoTrueClient, realtime, `createBrowserClient`), plus app code | `/` only (not `/savings`, `/compare`, etc.) |
| `2m-1dxvfr6sl5.js` | 228,922 | 71,576 | react-dom, scheduler | every route |
| `44wryr_lu73nl.js` | 175,045 | 51,577 | micromark / mdast (react-markdown + remark-gfm) | **no route** (lazy, loaded when the AI sheet opens) |
| `3-k6w_y9etav9.js` | 128,767 | 34,629 | Next client runtime/router | every route |
| `0cz1d0mv5g_q7.js` | 112,594 | 39,627 | polyfills, `noModule` | every route (not fetched by modern browsers) |
| `3fgcmf7phldg4.js` | 107,443 | 37,307 | date-fns plus the `id` and `en-US` locales (statically imported by `utils/i18n/context.tsx:6-7`) | every route |

Static vs dynamic imports (verified in code):
- Dynamic: add-expense modal `BottomNav.tsx:13-14` (with prefetch on pointer/focus, `:69-70`); AI sheet `ai/AiAssistantProvider.tsx:10` (`ssr:false`, this is what keeps react-markdown/remark out of first load); `BudgetEditDialog` `DashboardClient.tsx:30`; `ExportShareModal` `ExpenseList.tsx:17`; `NotificationSettingsModal` and `EmailSyncSettingsModal` `UserMenu.tsx:19-20`; `canvas-confetti` in savings `SavingsClient.tsx:125`. The image-upload modal is imported statically by `QuickAddExpense.tsx:39` but rides in the lazily loaded add-expense chunk.
- Still static: `UpgradeAccountModal` in `DashboardClient.tsx:35` and `GuestLanding.tsx:5` (imports `utils/supabase/client`; this is why `/` carries the 89 KB-gz Supabase chunk that other routes do not); `canvas-confetti` and `qrcode` in `split/[id]/SplitBillViewer.tsx:19-20`, with the QR generated on mount (`:78-92`) for every viewer of a bill.
- No `React.lazy` anywhere; `next/dynamic` is used 6 times.

Assets: one variable web font (Plus Jakarta Sans, `display: "swap"`, 27,572 B woff2, 1 request); the welcome page uses `next/image` for `icon-192.png`; three raw `<img>` in AI sheet, image-upload modal, split viewer (user-supplied images, acceptable); five unused default Next SVGs remain in `public/` (`file`, `globe`, `next`, `vercel`, `window`; 0 references).

### 4.3 Server round trips (plan 6.7)

`app/page.tsx` signed-in, non-guest, full-document request, `typical` (Multi-Saku on, selection "all"), in execution order (verified in code):

1. `utils/supabase/proxy.ts:85` `auth.getUser()` (network call to Supabase Auth). The proxy skips this for RSC/prefetch navigations (`:44-55`), which is an improvement since Audit 001, but not for a full page load.
2. `app/page.tsx:52` `auth.getUser()` again.
3. `page.tsx:72-77` `processSubscriptionRenewals(user.id)` which calls `auth.getUser()` a third time (`app/subscriptions/actions.ts:258-260`) and then reads `subscriptions` (`:270-280`), plus inserts per due subscription.
4. `page.tsx:94` `getWalletBalances` (`wallet_balances` read, `utils/wallets/server.ts:202`). `getMultiSakuEnabledServer` reads `user_settings` only when the `MULTI_SAKU_ENABLED` cookie is missing (`:463-475`).
5. `page.tsx:127-150` `Promise.all` of four queries: week/month expenses, **all** `spent_at` values for the user (`select("spent_at")` with no range or limit, `:140-144`, used only for the streak, `:156-157`), prior month-to-date, subscriptions.
6. `page.tsx:164-170` `getPrimaryWallets`, which calls `getWalletBalances` a second time (`server.ts:251`); runs when Multi-Saku is off or selection is "all".
7. `page.tsx:176-205` `email_transactions` query, sequential after everything else.

So at least 7 sequential steps, 3 `auth.getUser` calls, 2 `wallet_balances` reads, and the unbounded streak query remain. `app/page.tsx` has no commits since `09d0221`, so Audit 001 item 48 is unchanged. Lighthouse server-response time for signed-in `/`: 131-169 ms (median 135 ms) from localhost to the live Supabase project; the real-world cost depends on user-to-region latency and was not measured.

### 4.4 Lab performance (Lighthouse 13.6.0, mobile preset, simulated throttling): LAB DATA, not field data

3 runs per route (1 for `large`), medians with [min-max]. Browser HeadlessChrome 158, form factor mobile, throttling method simulate, no run warnings. Raw reports in `SCRATCH/out/lighthouse/A-<label>-run<N>.json`.

| Route (auth) | Perf score | FCP ms | LCP ms | CLS | TBT ms | Speed Index ms | Server response ms |
|---|---|---|---|---|---|---|---|
| `/` (signed-out) | 95 [94-98] | 1,072 [1,065-1,093] | 1,072 [1,065-1,093] | 0 | 253 [176-294] | 1,072 [1,065-1,093] | 11 |
| `/` (typical) | 88 [85-91] | 1,081 [1,072-1,089] | **3,261** [3,163-3,414] | 0 | 237 [152-286] | 1,383 [1,379-1,484] | 135 |
| `/savings` (typical) | 86 [84-88] | 1,075 [1,066-1,094] | **3,274** [3,165-3,404] | 0 | 297 [256-330] | 1,477 [1,430-1,645] | 138 |
| `/compare` (typical) | 92 [91-93] | 1,076 [1,068-1,092] | **2,964** [2,895-2,979] | 0 | 180 [163-221] | 1,294 [1,225-1,344] | 148 |
| `/split/<id>` friend view (signed-out) | 92 [90-94] | 1,086 [1,074-1,755] | 1,086 [1,074-1,755] | 0 | 357 [240-397] | 1,493 [1,401-1,755] | 19 |
| `/` (large, 1 run) | 92 | 1,070 | **3,171** | 0 | 139 | 1,382 | 136 |

Reading the lab numbers (thresholds from plan 3.5: LCP <= 2.5 s, CLS <= 0.1; INP <= 200 ms):
- CLS: 0.000 in all 16 runs (lab, page load only; no shifts after interaction measured).
- LCP: signed-in pages are above 2.5 s in every run (2.9-3.4 s lab, simulated slow 4G). The LCP element is a text node (the 4xl hero amount, for example `Rp 74.833`, or the compare card text), not an image. Lighthouse's LCP breakdown shows "element render delay" of 796 ms on `/` and 518 ms on `/compare` over a 136-150 ms server response, with FCP at 1.08 s. The cause is not proven. One plausible contributor is the font swap (single `display:swap` font, `/` render-blocking CSS est. 460 ms by Lighthouse); I did not test it (UNVERIFIED hypothesis).
- TBT (lab proxy for responsiveness): 140-400 ms, i.e. moderate main-thread work during load (bootup 0.7-0.9 s, main-thread 1.3-1.8 s in the reports). TBT is **not** INP.
- INP: cannot be measured by Lighthouse navigation mode. **UNVERIFIED.** Field data (CrUX / Vercel Speed Insights): **UNVERIFIED**, not obtained (no access; localhost is not in CrUX).
- The `large` account (600 expenses) is not slower than `typical` in the lab (score 92, TBT 139 ms).
- Lighthouse "unused JavaScript" estimate: 103 KiB on signed-in `/`, 49 KiB signed-out `/`, 28 KiB `/compare`.

### 4.5 Console and React warnings (plan 6.7)

- Dev (`http://localhost:3000`, Next dev + Turbopack, confirmed by `[turbopack]_browser_dev_hmr-client` chunk), `typical`, 9 routes plus the account menu on `/`: 0 console errors, 0 warnings, 0 page errors, 0 failed requests, 0 HTTP >= 400. Screenshot of the menu: `shots/A/menu-dev.png`.
- Prod (3100), same pass: 0 events. Screenshot `shots/A/menu-prod.png`.
- Audit 001's `/subscriptions` React key warning did not reproduce with `typical` data on dev. Limitation: states that need interaction (add/edit forms, AI sheet) were not exercised here.

### 4.6 PWA and offline (plan 6.8)

Manifest (`/manifest.webmanifest`, 200, `application/manifest+json`): name "SakuTrack : Student Budget Tracker", short_name "SakuTrack", `start_url "/"`, `id "/"`, `scope "/"`, `display standalone`, `orientation portrait`, `background_color` and `theme_color` `#fff8ec` (cream, matches the light default), 4 icons. No `lang`, `categories`, `shortcuts` or `screenshots`. `app/layout.tsx:19-32` metadata description is English while the manifest description is Indonesian (minor).

Icons (PNG headers read): `icon-192.png` 192x192 8,741 B; `icon-512.png` 512x512 27,405 B; `icon-maskable-192.png` 192x192 6,183 B; `icon-maskable-512.png` 512x512 20,394 B; `app/icon.png` 256x256. The maskable artwork sits inside the central safe zone (logo spans about 28-72% of the canvas, viewed in `icon-maskable-512.png`). Audit 001 item 49 (single 126 KB 2000 px file) is fixed.

Service worker `public/sw.js` (read in full):
- Cache: only `sakutrack-offline-v1` containing `/offline.html` (confirmed live: `caches` has exactly one entry for that URL after loading `/` and `/savings` twice each).
- `fetch` handler: acts only on `request.mode === "navigate"`; `fetch(request).catch(() => caches.match(OFFLINE_URL))`. API calls, RSC payloads, assets and authenticated HTML are never cached by the SW. Dynamic HTML is also `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (live header on `/savings`).
- Update strategy: `skipWaiting()` on install and `clients.claim()` on activate; activate deletes every cache except the current name; versioning is manual (`-v1`). Offline page changes only propagate when `sw.js` bytes change or the cache name is bumped. `sw.js` is served `public, max-age=0` and excluded from the proxy matcher. Not exercised across a real version change (UNVERIFIED live).
- Registration is gated by `isPushNotificationSupported()` (`utils/pwa/pushManager.ts:3-10`, used at `:33`), i.e. it also needs `PushManager` and `Notification`.
- Push and `notificationclick` handlers unchanged (push not tested).

**Critical privacy check (live, one persistent Playwright context, prod, 375x812):**
1. Signed in as `typical`; loaded `/`, reloaded, `/savings`, reloaded; SW state: registration scope `/`, state `activated`, controller present, cache keys = `["sakutrack-offline-v1"]` containing only `/offline.html`.
2. Signed out via the menu "Keluar": URL `/`, 0 `auth-token` cookies.
3. Signed in as `empty`: dashboard shows the empty-state values; no `[A002]` text.
4. `context.setOffline(true)`; `page.goto("/")` and `page.goto("/savings")`: both returned status 200 with title "Tidak ada koneksi : SakuTrack" and the offline page text. `[A002]` present: no. Typical markers (Spotify, Laptop, Kos, Mudik): none.
5. Signed out again (0 auth cookies), offline, `/` and `/savings`: same offline page, no `[A002]`.

Result: PASS. No authenticated content is cached by the SW, so no cross-account or signed-out exposure through it. Evidence: `SCRATCH/out/lighthouse/A-pwa.json`, screenshots `shots/A/pwa-03-empty-offline_.png`, `pwa-03-empty-offline_savings.png`, `pwa-04-signedout-offline_.png`, `pwa-04-signedout-offline_savings.png`. Limits: one browser, Chromium only; HTTP cache/bfcache was not separately attacked (the HTML is `no-store`).

Offline behaviour: the offline page (bilingual ID + EN text, "Coba lagi" reload button of 44 px min height) says the app needs a connection and that saved data is safe. There is no offline shell, no read-only cached data, no write queue, no `navigator.onLine` or online/offline event use anywhere in `app/` or `utils/` (grep). Offline add-expense: the server action call rejects and `QuickAddExpense.tsx:648-650` / `:704-706` / `:570-572` show `err.message` inline and keep the modal open (no data loss, no duplicate risk; the text would be the browser's raw network error, likely English). Agent D tests this live; my statement is code-level only.

### 4.7 Authorization and other engineering risks (verified in code unless stated)

- `/split/[id]/edit`: page redirects signed-out and anonymous users (`edit/page.tsx:21-25`), calls `notFound()` for a missing bill, and redirects non-creators to the viewer (`:38-41`). Live (read-only): `empty` requesting the `typical` bill's `/edit` URL ended on `/split/49b6b834.../` (the viewer); signed-out ended on `/`; `typical` got the edit form. `updateSplitBill` adds `.eq("creator_id", user.id)` (`app/split/actions.ts:329-331, 489-490`); `deleteSplitBill` likewise (`:281-289`). Repo `supabase/schema.sql:301-317` has "Creator manage" RLS policies on bills, participants and items; the live database policies were not inspected (UNVERIFIED).
- `toggleParticipantPaid` (`app/split/actions.ts:228-262`) checks only that a user exists (anonymous guests included), not that they are the creator; it relies on RLS. If RLS blocks the update it affects 0 rows without an error and the action returns `{ success: true }` (see finding A-12).
- API routes without a session (empty POST bodies): `/api/ai/advisor`, `/api/ai/extract`, `/api/email/parse-paste`, `/api/notifications/subscribe`, `/api/notifications/test` return 401; `/api/cron/notifications` returns 401 (checks `CRON_SECRET`, `route.ts:21-23`); `/api/email/inbound` returns 400 `MISSING_TOKEN` and authenticates by a 32-hex sync token that may arrive in the query string (`route.ts:105-115`), which can end up in access logs. All of these route handlers call `auth.getUser()` themselves (grep), since the proxy matcher excludes `/api`.
- `proxy.ts` matcher excludes `sw.js` and `offline.html` (so they are never redirected to login).

## 5. Findings

### [A-01] Dashboard server waterfall unchanged: 3 auth calls, 2 wallet reads, unbounded streak query
- Status: FAIL
- Priority: P2
- Category: Performance
- Confidence: Verified in code
- Route: `/` · Viewport: n/a · Theme: n/a · Auth state: signed in (non-guest)
- Expected: Plan 6.7 "inspect sequential server requests and duplicate queries"; Audit 001 item 48.
- Actual: see section 4.3. `app/page.tsx:52` + `subscriptions/actions.ts:260` + `utils/supabase/proxy.ts:85` each call `auth.getUser()`; `getWalletBalances` runs at `page.tsx:94` and again via `getPrimaryWallets` (`:164`, `server.ts:251`); `page.tsx:140-144` selects every `spent_at` the user ever logged only to compute the streak; the email query (`:186-205`) waits for all other work; `processSubscriptionRenewals` (writes) runs inside every dashboard render.
- Repro steps: 1. Read `app/page.tsx` and the helpers named above. 2. Count awaits before `return`.
- User impact: slower first render on every full load, growing with history size; dashboard TTFB 131-169 ms on localhost; unknown on a real network.
- Evidence: `app/page.tsx:52,72-77,94,127-150,164-170,176-205`; lab server response times in 4.4.
- Acceptance criteria:
  - [ ] One `auth.getUser` per full-document request on `/`.
  - [ ] Wallet balances read once per request.
  - [ ] Streak computed from a bounded or aggregated query.
  - [ ] Independent queries (subscriptions, wallets, email transactions) run in parallel.

### [A-02] Signed-in LCP above 2.5 s in lab on dashboard, savings, compare
- Status: FAIL (lab only)
- Priority: P2
- Category: Performance
- Confidence: Verified live (lab data)
- Route: `/`, `/savings`, `/compare` · Viewport: Lighthouse mobile emulation 412x823 · Theme: light · Auth state: `typical` (and `large` for `/`)
- Expected: Core Web Vitals LCP <= 2.5 s (plan 3.5). Lab data is reported separately and is not proof of field performance.
- Actual: median LCP 3,261 ms (`/`), 3,274 ms (`/savings`), 2,964 ms (`/compare`), 3,171 ms (`large` `/`), against FCP of about 1.08 s and server response of about 135-150 ms. LCP element is the hero text, with a 0.5-0.8 s element-render delay (Lighthouse LCP breakdown). Cause not isolated (font swap and hydration are candidates, UNVERIFIED).
- Repro steps: 1. `node SCRATCH/tools/agent-A-lh.mjs typical`. 2. Read `lcp` in `A-summary-typical.json`.
- User impact: on a slow mobile connection the main number appears about 2 s after first paint.
- Evidence: `SCRATCH/out/lighthouse/A-typical-home-run1..3.json`, `A-typical-savings-run1..3.json`, `A-typical-compare-run1..3.json`, `A-large-home-run1.json`.
- Acceptance criteria:
  - [ ] Lab LCP <= 2.5 s on these routes with the same Lighthouse settings, and field LCP p75 <= 2.5 s once field data exists.

### [A-03] Supabase browser client and auth modal ship in the `/` first load
- Status: PARTIAL
- Priority: P3
- Category: Performance
- Confidence: Verified in code (chunk attribution is by string signature)
- Route: `/` · Viewport: n/a · Theme: n/a · Auth state: signed in and signed out
- Expected: Plan 6.7 "check whether heavy modals and feature-specific modules are loaded only when needed".
- Actual: `UpgradeAccountModal` is a static import in `DashboardClient.tsx:35` and `GuestLanding.tsx:5` and imports `@/utils/supabase/client`. Chunk `329bi_ny3rs1z.js` (335,839 B raw / 88,929 B gz, contains the Supabase auth/realtime client) is in `/` first load and absent from `/savings`, `/compare`, `/archive`, `/split*`, `/subscriptions`. The 89 KB gz figure is the whole chunk, not only the Supabase part.
- Repro steps: 1. Fetch `/` HTML signed in; list script chunks (see `A-bundle.json`). 2. Compare with `/savings`.
- User impact: extra download and parse on the dashboard for a modal most signed-in users never open.
- Evidence: `A-bundle.json` route chunk lists; `DashboardClient.tsx:35,643`; `GuestLanding.tsx:5`.
- Acceptance criteria:
  - [ ] `UpgradeAccountModal` loaded with `next/dynamic` (or on interaction); `/` first-load gzip decreases by the size of the moved code.

### [A-04] Unset budget shown as if the user had set Rp 500.000
- Status: FAIL
- Priority: P2
- Category: Content (financial information) / UX
- Confidence: Verified live and in code
- Route: `/` and the account menu · Viewport: 375x812 · Theme: light · Auth state: `empty` (new account, no budget set)
- Expected: Plan 6.6 "budget comparisons use equivalent periods or explain their methodology"; Audit 001 item 36 (phantom budget) spirit; a new user should be asked for a budget or shown that none is set.
- Actual: `empty`'s dashboard reads "Aman. Rp 500.000 untuk 3 hari lagi", "Rp 0 dari Rp 500.000 minggu ini", "Sisa hari ini Rp 166.667" with no budget ever entered. Source: hard-coded fallbacks `utils/budget.ts:48-52,74` (`: 500000`), `utils/wallets/server.ts:273` (`weekly_budget: 500000`).
- Repro steps: 1. Sign in as `empty`. 2. Open `/`.
- User impact: a new user sees a daily allowance and a "safe" status computed from a number they did not choose.
- Evidence: `SCRATCH/out/lighthouse/A-pwa.json` (`emptyOnlineText`), `shots/A/pwa-02-empty-online.png`; `utils/budget.ts:74`.
- Acceptance criteria:
  - [ ] With no budget set, the dashboard shows a "set your budget" state, or labels the figure as a default and links to editing it.

### [A-05] Failed reads render as empty data
- Status: FAIL
- Priority: P2
- Category: Reliability
- Confidence: Verified in code
- Route: `/`, `/savings`, `/compare`, `/archive`, `/subscriptions`, `/saku`, `/split` · Viewport: n/a · Theme: n/a · Auth state: signed in
- Expected: Plan 6.6 "Failed network requests do not masquerade as empty data"; Audit 001 item 9.
- Actual: no server page destructures `error` from its Supabase queries (`app/page.tsx:127-150` takes only `data`; same pattern in `savings`, `compare`, `archive`, `subscriptions`, `saku` pages). `split/page.tsx:58-60` logs the error with `console.error` and renders an empty list. `error.tsx` and `not-found.tsx` exist now but are only reached if something throws.
- Repro steps: 1. Read the listed pages. 2. Note that a query error yields `null` data and a normal empty-state UI.
- User impact: a transient database failure shows "no expenses / no bills" instead of an error, which a user may read as lost data.
- Evidence: `app/page.tsx:127-150`; `app/split/page.tsx:58-60`; grep for `error` destructures returned 0 in six of eight page files.
- Acceptance criteria:
  - [ ] A failed query shows an explicit error state with retry, distinct from the empty state.

### [A-06] Some write handlers still have no failure feedback; 19 native dialogs remain
- Status: PARTIAL
- Priority: P2
- Category: Reliability / UX
- Confidence: Verified in code
- Route: `/savings`, `/subscriptions`, `/split`, email banner, menu · Viewport: n/a · Theme: n/a · Auth state: signed in
- Expected: Audit 001 item 9; plan 6.6 "failed saves produce visible, actionable feedback".
- Actual: savings create/allocate/withdraw/sweep now `catch` and call `showActionError` (`SavingsClient.tsx:114,169-170,207-208`), but `handleDeleteGoal` (`:176-185`) and `handleDeleteEntry` in `SavingsBalanceHistory.tsx:146-155` are `try/finally` with no `catch` (a rejected server action is an unhandled rejection with no message). `PendingTransactionsBanner.tsx:57,74,101` only `console.error`. `alert(` 11 uses and `confirm(` 8 uses remain (`NotificationSettingsModal`, `SakuHubClient`, `SplitBillHistoryClient`, `SplitBillViewer`, `SubscriptionsClient`, `EmailSyncSettingsModal`, `SavingsBalanceHistory`, `SavingsClient`).
- Repro steps: 1. Read the files above.
- User impact: silent failure on delete and email approve/dismiss; blocking native dialogs on mobile.
- Evidence: line references above; `grep -rn "alert(\|confirm(" app` = 19.
- Acceptance criteria:
  - [ ] Every mutation shows an in-app error on failure. [ ] Destructive confirmations use the app dialog rather than `confirm()`.

### [A-07] Auth errors are raw English Supabase messages; no forgot-password; no show-password toggle
- Status: FAIL
- Priority: P2
- Category: UX / Content
- Confidence: Verified in code
- Route: `/?auth=login`, `/login` · Viewport: n/a · Theme: n/a · Auth state: signed out
- Expected: Audit 001 item 34; NN heuristic 9 (help users recover from errors), consistent language.
- Actual: `app/actions.ts:46,108,166,195,254` pass `error.message` through the URL or return value unchanged; `UpgradeAccountModal.tsx:111,129` shows `err.message` or the literal "Authentication failed". No mapping table. No "forgot password" text or flow (grep of `app/` and dictionaries for forgot/lupa/reset password found only unrelated strings). Password input is plain `type="password"` (`UpgradeAccountModal.tsx:300-308`), no reveal control.
- Repro steps: 1. Read the files above. (Live message text not captured by me.)
- User impact: an Indonesian-language app shows English technical errors; a user who forgets a password has no in-app recovery.
- Evidence: line references above.
- Acceptance criteria:
  - [ ] Known auth errors map to localized messages. [ ] A password-reset path exists. [ ] Password fields have a reveal toggle.

### [A-08] Most form fields have no programmatic label
- Status: FAIL (pending live axe from other agents)
- Priority: P2
- Category: Accessibility
- Confidence: Verified in code (static heuristic; may over-count controls whose props are spread)
- Route: add expense, savings, saku, split creator, subscriptions, notifications, AI sheet · Viewport: n/a · Theme: n/a · Auth state: signed in
- Expected: WCAG 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value; Audit 001 item 2.
- Actual: `htmlFor` 6 uses (was 2), `<label` 59; `app/ui/Field.tsx` (id-linked label, hint and error) is used in only 3 files (`BudgetEditDialog`, `EmailSyncSettingsModal`, `ExpenseList`). My script (`agent-A-labels.mjs`) found 88 non-hidden `input/textarea/select` elements; 10 carry `id` or `aria-label`, 7 sit inside a wrapping `<label>`, 71 do not. Example: `SavingsClient.tsx:641-664` a sibling `<label>` with no `htmlFor` above an `<input>` with no `id`.
- Repro steps: 1. `node SCRATCH/tools/agent-A-labels.mjs`.
- User impact: screen-reader users hear unlabeled edit fields; tapping the label does not focus the field.
- Evidence: script output listing file:line of all 71.
- Acceptance criteria:
  - [ ] Every visible field is associated with its label (`Field.tsx` or `htmlFor`/`id`). [ ] axe `label` rule reports 0 violations on all forms.

### [A-09] Split creator: scanned items are assigned to the host only; removing the sole assignee silently re-shares
- Status: PARTIAL
- Priority: P2
- Category: UX / financial correctness
- Confidence: Verified in code
- Route: `/split/new`, `/split/[id]/edit` · Viewport: n/a · Theme: n/a · Auth state: signed in
- Expected: Plan 6.6 "Split Bill allocations reconcile to the total"; Audit 001 item 28.
- Actual: the manual-entry default is now fixed (see section 6 item 28). Residual: items created from a receipt scan are `assignedParticipantIds: [creatorPartId]` (`SplitBillCreator.tsx:251,267`) even when friends are already added, and `handleAddParticipant` only adds a friend to items already shared by everyone (`:458-463`), so scanned items stay host-only until the user toggles chips. `handleRemoveParticipant` (`:469-480`) replaces an emptied assignment with "everyone remaining", silently changing who pays. `utils/splitCalculator.ts:146-148` still falls back to "split with all" for an empty assignment (comment in code: "fallback: split with all if none selected").
- Repro steps: 1. Read the lines above (live flow not exercised by me; `typical` is read-only).
- User impact: the host may be charged for scanned items until they reassign them; the totals still reconcile to the bill, so the error is in who owes what, not in the total.
- Evidence: line references above.
- Acceptance criteria:
  - [ ] Scanned items default to the same rule as manual items. [ ] Removing a participant who was the only assignee of an item asks or flags the item.

### [A-10] Confetti in the split viewer ignores reduced motion; confetti and qrcode are static imports there
- Status: PARTIAL
- Priority: P3
- Category: Accessibility / Performance
- Confidence: Verified in code
- Route: `/split/[id]` · Viewport: n/a · Theme: n/a · Auth state: any
- Expected: WCAG 2.3.3 Animation from Interactions (AAA, best practice); Audit 001 items 4 and 51. CSS animations are covered by `globals.css:491-499`, but `canvas-confetti` is a canvas animation outside that rule.
- Actual: `SplitBillViewer.tsx:98-104` calls `confetti({ particleCount: 60, ... })` without `disableForReducedMotion`; savings does set it (`SavingsClient.tsx:127`). `qrcode` is generated on mount for every viewer (`:78-92`).
- Repro steps: 1. Read the lines above.
- User impact: motion shown to users who asked for reduced motion when a bill becomes fully paid; extra JS for every friend opening a bill link.
- Evidence: line references above.
- Acceptance criteria:
  - [ ] `disableForReducedMotion: true` on all confetti calls. [ ] QR and confetti code loaded on demand.

### [A-11] Offline writes are neither queued nor explained, and SW registration needs Push support
- Status: PARTIAL
- Priority: P3
- Category: PWA / Reliability
- Confidence: Verified in code
- Route: all · Viewport: n/a · Theme: n/a · Auth state: signed in
- Expected: Plan 6.8 "essential offline actions either work safely or explain why they cannot; unsynced data is not silently lost; sync and retry states are understandable".
- Actual: the SW offline page only covers navigations. There is no connectivity indicator (`navigator.onLine`/online events: 0 matches). Add-expense failure shows the raw rejected message and keeps the form (`QuickAddExpense.tsx:648-650`). `registerServiceWorker` returns early unless `PushManager` and `Notification` exist (`utils/pwa/pushManager.ts:3-10,33`), so browsers without push (for example iOS Safari in a normal tab) never get the offline page. `InstallPrompt.tsx` handles only `beforeinstallprompt` (no iOS instructions).
- Repro steps: 1. Read the files above. Agent D covers the live offline add.
- User impact: logging an expense with no signal fails with a technical message; nothing is saved for later.
- Evidence: `public/sw.js:19-24`; `pushManager.ts:3-10`; `InstallPrompt.tsx:17-44`.
- Acceptance criteria:
  - [ ] Offline attempts show a plain-language message (and ideally queue with a visible "not yet saved" state). [ ] SW registers whenever service workers are supported.

### [A-12] `toggleParticipantPaid` has no creator check and can report success without changing anything
- Status: PARTIAL
- Priority: P3
- Category: Reliability (authorization)
- Confidence: Verified in code (RLS on the live DB not inspected: Unverified)
- Route: `/split/[id]` · Viewport: n/a · Theme: n/a · Auth state: any signed-in user, including guests
- Expected: Plan 6.6 "authentication and authorization boundaries are respected".
- Actual: `app/split/actions.ts:228-262` checks only `if (!user)`; the `.update()` filters by `id` and `bill_id`, not creator. Safety depends on the RLS policy "Creator manage split_participants" (`supabase/schema.sql:307-310`). If RLS rejects, 0 rows update, `partError` is null, and the action returns `{ success: true }` after a no-op touch of `split_bills`.
- Repro steps: 1. Read the action.
- User impact: none for the creator; a non-creator gets a false success.
- Evidence: line references above.
- Acceptance criteria:
  - [ ] Action verifies `creator_id = user.id` and returns an error otherwise.

### [A-13] Compare headline shows "0% more" when the like-for-like baseline is zero
- Status: PARTIAL
- Priority: P3
- Category: Content (financial information)
- Confidence: Verified in code
- Route: `/compare` · Viewport: n/a · Theme: n/a · Auth state: signed in with spending this week and none in the same days last week
- Expected: Plan 6.6 budget comparisons use equivalent periods or explain methodology.
- Actual: the like-for-like fix is in (`compare/page.tsx:127-136`), but `percentDiff` is forced to 0 when `lastTotalSameDays` is 0 (`:138-139`); with `diffAmount > 0` the badge renders `{percentDiff}% {moreThanLastWeek}` = "0% lebih boros dari minggu lalu" beside "+Rp X" (`:273-278`).
- Repro steps: 1. Read the lines above (not reproduced live; no test account has that shape).
- User impact: a misleading percentage for a first week of spending.
- Evidence: line references above.
- Acceptance criteria:
  - [ ] When the baseline is 0, show the amount without a percentage (or "no spending last week").

### [A-14] Hardcoded strings and inline locale ternaries bypass the dictionary
- Status: PARTIAL
- Priority: P3
- Category: Content
- Confidence: Verified in code
- Route: AI sheet, image upload, saku modals, add expense, auth · Viewport: n/a · Theme: n/a · Auth state: n/a
- Expected: Plan 6.5 localization; Audit 001 item 38.
- Actual: 73 `locale === "id"` ternaries in 9 files (`ImageUploadModal` 36, `AiAssistantSheet` 17, `AiAdvisorCard` 9, others 1-3); hardcoded Indonesian placeholders in saku modals (`IncomeModal.tsx:126,141`, `SakuFormModal.tsx:316,330`, `TransferModal.tsx:154,169`), `saku/page.tsx:56-64`, `QuickAddExpense.tsx:1009`; hardcoded English `One-Off` (`QuickAddExpense.tsx:1541`), `Authentication failed` (`UpgradeAccountModal.tsx:111`), `Emoji` placeholder (`:1839`).
- Repro steps: 1. `grep -rn 'locale === "id"' app`.
- User impact: language switch does not change some text; English strings in the Indonesian UI.
- Evidence: counts above.
- Acceptance criteria:
  - [ ] User-visible strings come from `dictionaries.ts` in both languages.

### [A-15] 13 lint errors remain and lint is not part of the build
- Status: FAIL
- Priority: P3
- Category: Engineering quality
- Confidence: Verified in code (`lint.log`)
- Route: n/a
- Expected: plan 6.7 engineering quality.
- Actual: see 4.1. React Compiler rules flag 5 `set-state-in-effect`, 1 use-before-declare, 1 skipped memoization; 6 explicit `any`. `npm run build` exits 0 regardless.
- Acceptance criteria:
  - [ ] `npm run lint` exits 0, or the rules are deliberately configured. [ ] CI runs lint.

## 6. Audit 001 cross-check (items 1-53)

Legend: FIXED / PARTIAL / STILL PRESENT / REGRESSED (none found) / NEEDS-LIVE (cannot be settled from code) / UNVERIFIED. "Code" = verified in code; counts re-run with the same searches over `app/` and `utils/`.

| # | Status | Evidence |
|---|---|---|
| 1 Dialog semantics | FIXED (code); focus behavior NEEDS-LIVE | All 21 `fixed inset-0` overlays are `ModalOverlay` (grep per site, `ModalOverlay.tsx:1-100`: `role="dialog"`, `aria-modal`, Escape, Tab trap, focus return); `AiAssistantSheet.tsx:281` has its own `role="dialog"`; new `ui/Dialog.tsx` used by `UserMenu`, `BudgetEditDialog`, `ExpenseList`, `EmailSyncSettingsModal`. `role="dialog"` 7 uses in 6 files (was 4); Escape handlers in 8 files (was 5). Caveat: `ModalOverlay.close()` clicks a `svg.lucide-x` button else simulates a backdrop mousedown. |
| 2 Labels | PARTIAL / STILL PRESENT | `<label` 59, `htmlFor` 6 (was 58 / 2); `Field.tsx` used in 3 files; 71 of 88 controls unlabeled by heuristic (finding A-08). |
| 3 Pinch zoom | FIXED | 0 matches for `maximumScale|userScalable`; viewport sets only `width`/`initialScale` (`layout.tsx:38-40`). |
| 4 Reduced motion | PARTIAL | `globals.css:491-499` global `prefers-reduced-motion` rule; `loading.tsx` uses `motion-safe:animate-pulse`; savings confetti `disableForReducedMotion` (`SavingsClient.tsx:127`); `SplitBillViewer.tsx:99` confetti does not (A-10). |
| 5 Tap targets < 44 px | NEEDS-LIVE | Code proxy: `h-11/h-12/min-h-11` family 96 uses (`BottomNav`, `Field`, delete button `SavingsBalanceHistory.tsx:514` is `h-11 w-11`); 72 `h-6..h-9` uses remain. Measured by Agents B/C. |
| 6 Contrast | NEEDS-LIVE | Tokens `--muted-400/500`, `--ink-soft` added (`globals.css`); `text-emerald-400` 59 and `text-amber-400` 33 raw uses remain. axe agents measure. |
| 7 Em dash | FIXED | `—` in `app/` and `utils/` .ts/.tsx: 0 (was 3+). 6 en dashes `–` in date ranges (`compare/page.tsx:253-254`, `archive/page.tsx:115`, `ExportShareModal.tsx:103,108`, `savings/page.tsx:137`), not em dashes. |
| 8 Light-mode skeletons | FIXED | `app/loading.tsx`, `compare/loading.tsx`, `archive/loading.tsx` use `bg-line` tokens (0 `zinc-800/900`); `savings/` and `subscriptions/loading.tsx` have `dark:` variants (18 and 8). `/saku`, `/split*` still use the generic `app/loading.tsx`, now deliberately generic (comment at top of file). |
| 9 Error states | PARTIAL | `app/error.tsx` (uses `retry`, valid for Next 16.3 per docs) and `not-found.tsx` exist; no `global-error.tsx`. Savings handlers mostly caught but two delete handlers not; email banner `console.error` only; `split/page.tsx:58-60` empty-list masquerade; `alert(`+`confirm(` = 19 (was 21). See A-05, A-06. |
| 10 Dead / hover-only controls | FIXED | Emoji "button" is now a non-interactive `<span aria-hidden>` (`SakuFormModal.tsx:201-207`); savings history delete always visible, 44 px (`SavingsBalanceHistory.tsx:511-516`); split participant row is `<button aria-expanded>` (`SplitBillViewer.tsx:372-380`). |
| 11 No design direction | FIXED | `DESIGN.md` exists; semantic tokens at `globals.css:1-45`. |
| 12 Sparkles overuse | STILL PRESENT | `<Sparkles` 24 uses in 17 files (41 grep lines incl. imports); Audit 001 reported 31. Used for AI, empty state, tips, budget notes, signup (`UpgradeAccountModal.tsx:341`). |
| 13 Uppercase tracking labels, Geist | FIXED | 0 `uppercase` classes in `app/`; 0 `text-[9|10|11px]`; font is Plus Jakarta Sans (`layout.tsx:2,13`), no Geist/Geist Mono. |
| 14 Gradients and glow | PARTIAL | Amber gradient `PendingTransactionsBanner.tsx:110`; `TrackingStreak.tsx:128,196` gradient badges and `:94` `blur-2xl` glow; `AiAdvisorCard.tsx:94` (component now unused). |
| 15 `backdrop-blur` | FIXED | 1 use (`ImageUploadModal.tsx:841`, `backdrop-blur-[1px]`) vs 38. |
| 16 Capsule badges (DeepSeek, BYOK, FREE TIER) | FIXED (code) | No `BYOK` / `FREE TIER` / `deepseek-chat` strings in UI; "DeepSeek" only in key-settings copy (`AiAssistantSheet.tsx:436,562`). |
| 17 Arrows on buttons | FIXED | 1 `→` left in `app/` (`ActionProposalCard.tsx:167`, a before/after value diff). |
| 18 Welcome screen template | FIXED (code) | `WelcomeGuestModal.tsx` is a page: heading, 3-item check list, risk card, two buttons; no three-card grid. Dead leftover copy: dictionary keys `instantTitle`/`insightsTitle`/`continueBtn` (`dictionaries.ts:1344-1358`) have 0 uses in `app/`. |
| 19 Color families | PARTIAL | Class uses in `app/`: emerald 365 (was 425), amber 247 (408), teal 263 (309), rose 206 (242), purple 82 (94), blue 53 (86), indigo 22 (55), orange 25 (36), pink 15 (29); red 12, violet 10, yellow 2, green 2, cyan 0. 13 families still used; palette tokens remap `zinc`/`amber` per palette (`globals.css:44-80`). |
| 20 Pill shapes | PARTIAL (design) | `rounded-full` 76 uses vs `rounded-xl/2xl/3xl` 471; no baseline count in Audit 001 to compare. |
| 21 No identity / R-20 | FIXED (design) | Warung identity documented in `DESIGN.md`; not judged visually here. |
| 22 Dark default / theme colors | FIXED | Default theme is `light` (`utils/theme/server.ts:11`); `generateViewport` sets `themeColor` per theme (`layout.tsx:34-39`); manifest `#fff8ec`. |
| 23 Text under 12 px | FIXED (code); NEEDS-LIVE for computed sizes | 0 `text-[9|10|11px]` (was 428) and 0 sub-12 rem arbitrary sizes; smallest class is `text-xs` (12 px, 727 uses). |
| 24 First visit modal over nothing | FIXED (code) | `GuestLanding`/`WelcomeGuestModal.tsx` is a full page (`main`), not an overlay. Visual check NEEDS-LIVE. |
| 25 Backdrop tap creates guest | FIXED | No backdrop handler; a guest is created only by the `continueAsGuest` form button (`GuestLanding.tsx:76-80`). |
| 26 Search only today | PARTIAL | `ExpenseList.tsx:79-83`: any search/category filter looks through the whole loaded period (week or month, `all`), not just today. Older periods are still outside dashboard search; the archive has its own search. |
| 27 Compare headline | FIXED | `compare/page.tsx:127-139` compares this week with last week up to the same weekday (`lastTotalSameDays`); card labels "Sampai hari ke-N" (`:286-292`). Edge case A-13. |
| 28 Split defaults | PARTIAL (manual path fixed) | `SplitBillCreator.tsx:458-463` adds a new friend to every item that all current participants share; new items default to everyone (`:491`); `handleRemoveParticipant` never leaves an item empty (`:476-479`) but re-shares silently; first item starts host-only with only the host present (`:167`). Calculator fallback for empty assignment unchanged (`splitCalculator.ts:146-148`). Residual A-09. |
| 29 Edit erases notes | FIXED (code); NEEDS-LIVE to confirm | Edit loads `sub.notes` (`SubscriptionsClient.tsx:181`) and sends it (`:228`); `actions.ts:99` writes `notes` only when provided. Residual: the form still has no notes field, so notes cannot be seen or edited (no `value={notes}` input, only state). |
| 30 Features hidden in menu | PARTIAL | Bottom nav now Home, Split, Add, Savings/Saku, Compare (`BottomNav.tsx:36-48`); menu is a `Dialog` with two labelled sections "Halaman" / "Pengaturan" (`UserMenu.tsx:241-265`); Subscriptions, Archive, Notifications, Email sync remain in the menu; bottom nav is still hidden on `/split/*` detail pages (`BottomNav.tsx:31-35`). |
| 31 Saku unreachable | FIXED | `utils/wallets/config.ts:14` `FEATURE_MULTI_SAKU_ENABLED = true`; `/saku` returned 200 for `typical` (`A-bundle.json`). |
| 32 Add modal modes / Rp 0 | PARTIAL | Two input modes (`quick_type`, `standard`, `QuickAddExpense.tsx:163`) plus photo flow; amount must be positive (`:612` `amountPositiveError`); "keep open" batch option exists (`:1738`). Header wrap and default-stay-open behavior NEEDS-LIVE. |
| 33 Money inputs `type="number"` | PARTIAL | Add-expense amount is a grouped text field (`QuickAddExpense.tsx:1129-1138`, `toLocaleString("id-ID")`); a grouped money field exists in `ui/Field.tsx:99-113`; `type="number"` remains in `SavingsClient.tsx` (5), `SplitBillCreator.tsx` (6), `QuickAddExpense.tsx:1865`. |
| 34 Auth errors / forgot password / show password | STILL PRESENT | See A-07. |
| 35 Bottom nav behind welcome | FIXED | `BottomNav` returns `null` when signed out (`BottomNav.tsx:32-34`, `layout.tsx:53,83`). |
| 36 Export phantom budget | FIXED | `ExportShareModal.tsx:33` default `weeklyBudget = 0`; budget lines only when `summary.budget > 0` (`:137`); `ArchiveWeekList` passes no budget so the archive recap has no budget line (design gap). Note: the dashboard has its own phantom default (A-04). |
| 37 Clipboard false success | PARTIAL | `SplitBillViewer.tsx:120-143`: "copied" set only after the promise resolves; on failure it silently resets (no message). |
| 38 Mixed languages | STILL PRESENT | See A-14. |
| 39 AI quoted 450k vs 350k | UNVERIFIED | Both use `resolveBudgets` (`snapshot.ts:125`). In Multi-Saku "all" view the budget is the sum of spending Sakus (`utils/budget.ts:57-74`); the typical menu shows "Rp 500.000" (350k + 150k), which is consistent with that rule. Not tested with the AI. |
| 40 Dashboard buries list | FIXED (code); NEEDS-LIVE to measure | Order in `DashboardClient.tsx`: header, Saku switcher, cadence, budget, notice rows, `ExpenseList` (`:587`), insights last (`:598+`). |
| 41 Three fixed bottom layers | FIXED (code) | One fixed nav containing the Add control (`BottomNav.tsx:60`); no gradient layer. |
| 42 Five AI routes | FIXED (code) | Dashboard entry is `AiHeaderButton` (`DashboardClient.tsx:479`) plus the menu toggle; `AiAdvisorCard.tsx` is now unused (0 importers). |
| 43 Savings page density | NEEDS-LIVE | `SavingsClient.tsx` 1,121 lines; "Alirkan"/"Alokasikan" wording: only "Alokasikan" found in dictionary (`:1415,1439,1448`). |
| 44 Header wraps at 375 | NEEDS-LIVE | Title is `truncate` (`DashboardClient.tsx:454`) instead of wrapping. |
| 45 Archive 7,877 px | PARTIAL (code) | Only the most recent past week is expanded by default (`ArchiveWeekList.tsx:27-32`); one search state (`:34`), not one per week. Page height NEEDS-LIVE. |
| 46 No offline support | PARTIAL | Navigation fetch handler + `offline.html` + cache (`sw.js:5-24`), verified live; no offline data or write queue; registration gated on Push support (A-11). |
| 47 Heavy modals on every route | FIXED (mostly) | Dynamic imports listed in 4.2; lazy markdown chunk (175,045 raw / 51,577 gz) is in no route's initial scripts; `/` still has `UpgradeAccountModal` (A-03). |
| 48 Sequential dashboard trips | STILL PRESENT | A-01. |
| 49 PWA icons | FIXED (mostly) | Correct 192/512 sizes (8.7 KB, 27 KB) and maskable pair (6.2 KB, 20 KB); theme/background `#fff8ec`; still no `shortcuts` or `screenshots`. |
| 50 Every route SSR on demand | STILL PRESENT | All app routes `ƒ` in `build.log`; only `/icon.png`, `/manifest.webmanifest`, `/robots.txt` are static. |
| 51 confetti and qrcode static | PARTIAL | Savings confetti is dynamic; `SplitBillViewer.tsx:19-20` still static, QR generated on mount (A-10). |
| 52 CSS weight | PARTIAL | CSS 140,414 B raw (was 164,470; -14.6%), 19,615 B gz; arbitrary-value utilities 52 (was 473); color/opacity combos 218 (was 277); `dark:` 2,049 (was 2,782). |
| 53 Misc | PARTIAL | `backdrop-blur` fixed (see 15); `InstallPrompt` has no iOS path (STILL PRESENT); `login/GoogleSignInButton.tsx` unused (STILL PRESENT; the only importer is itself); `QuickAddExpense` default export (`:1933`) unused (STILL PRESENT); new dead code `AiAdvisorCard.tsx`; five unused default SVGs in `public/`. |

Tally: FIXED 26 (1, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 21, 22, 23, 24, 25, 27, 29, 31, 35, 36, 40, 41, 42, 47, 49), PARTIAL 17 (2, 4, 9, 14, 19, 20, 26, 28, 30, 32, 33, 37, 45, 46, 51, 52, 53), STILL PRESENT 5 (12, 34, 38, 48, 50), NEEDS-LIVE 4 (5, 6, 43, 44), UNVERIFIED 1 (39). REGRESSED: none found. Several items mix a fixed and an open part; the per-item rows are authoritative.

## 7. Strengths observed

- Privacy: the service worker is deliberately minimal and the cross-account offline test showed no leakage (section 4.6).
- Edit-bill authorization is enforced in the page and in the server action, and confirmed live for a second account.
- Bundle: the 51.6 KB-gz markdown/remark chunk is out of every route's first load; CSS shrank 14.6% and arbitrary-value utilities dropped from 473 to 52.
- Zero console errors or warnings on dev and prod across 9 routes; CLS 0 in all 16 Lighthouse runs.
- `app/ui/ModalOverlay.tsx` and `ui/Dialog.tsx` give every overlay dialog semantics, Escape, focus return and a Tab trap in one place.
- `proxy.ts` skips the Supabase auth call for RSC/prefetch navigations and signed-out visitors (`utils/supabase/proxy.ts:33-55`).
- Signed-out `/` and the friend view are fast in the lab (LCP about 1.1 s, score 92-95).
- The offline page is bilingual, themed and has a 44 px retry button.

## 8. Not tested / limitations

- INP, real-user (field) Core Web Vitals, real device or real network throttling: UNVERIFIED. Lighthouse used simulated throttling on a shared development machine with other agents active.
- Install flow, installed-app behavior and SW update across versions: UNVERIFIED (headless Chromium only; I never saw an install prompt).
- Live Supabase RLS policies were not inspected; authorization statements rest on repo code and one read-only live probe.
- Dev-mode console pass did not open forms, the AI sheet or the add-expense modal; error states were not forced.
- Audit 001 items marked NEEDS-LIVE (tap targets, contrast, header wrap, savings density, archive height) belong to other agents' live measurements.
- Sequential-round-trip count is from reading code, not from per-query timing.
- Chunk attribution (which modules sit in which hashed chunk) is by string signature, not a source-map analysis.
- The LCP cause (font swap or hydration) is a hypothesis, not tested.
- Lighthouse runs cleared only the HTTP cache between runs (cookies kept per `disableStorageReset`), so each run was a cold-cache load but with an established session.
