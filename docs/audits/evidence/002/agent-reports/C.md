# Agent C report: Responsive, visual design-system, content and localization (Audit 002)

## 1. Summary
- Layout is sound on 6 of 8 viewports for every route. At 375, 430, 768, 1024 (both), 1280 and 1440 there was no horizontal page scroll, no content covered by the fixed bar at scroll end, and no unreachable primary action.
- Real responsive defects appear only at 320x640: /subscriptions scrolls horizontally (scrollWidth 338 vs 320), the /split/new floating "Publikasikan" button spills out of its bar and past the viewport edge, and the bottom-nav label "Bandingkan" is ellipsised.
- Every modal tested fits 375x500 and 320x640 with an internal scroller and a reachable primary button. Resizing while a modal or the account menu is open (375 to 1280 to 320 to 375) also held up.
- Design-system drift is concentrated outside the home screen. Home is clean (3 text colors, 1 shadow, 0 gradients, 0 blur). Other routes still use legacy zinc/emerald/teal/indigo classes, card shadows and 24/8/6px radii. The phase-gate gradients and blur are confirmed in code (ProjectedBurnCard and archive gradients are dark-only).
- Content: the Indonesian UI has leftover English (category names, "Pacing", "burn rate", "One-Off", "Scan Struk"), mixed "Anda"/"kamu", ISO and month-first dates, and exclamation marks on system copy. In English mode /saku, wallet detail and the Add-expense dialog stay Indonesian.
- Language is a cookie only (NEXT_LOCALE, utils/i18n/context.tsx:59), so I tested EN by setting the cookie in my own context. Nothing was written to the DB.
- Skeletons are now theme-correct in light and dark (Audit 001 #8 fixed for colour). /split and /saku have no route-specific loading file and borrow the home-shaped skeleton.

## 2. What I ran
Tools: Playwright 1.65.0 headless Chromium via SCRATCH/tools/lib.mjs, production server http://localhost:3100. Roles: typical, large, empty, plus signed-out contexts. Scripts are in SCRATCH/tools (run with node from there). Raw JSON is in SCRATCH/out/C-data/, screenshots in SCRATCH/out/shots/C/ (about 334 files named route__viewport__theme__state.png).

Note: the saved login states for empty and typical went stale about 14 minutes after creation (every route showed the guest landing). I noticed it from a status-200 landing on /does-not-exist, discarded those results and re-ran the affected scripts (empty/error, loading, i18n, split bar, nav) after a fresh login. The matrix and style runs were checked: no signed-in cell shows the guest landing.

| Script (SCRATCH/tools) | Purpose |
|---|---|
| agent-C-common.mjs | helpers: storageState login, bottomCheck (scroll to bottom, compare lowest content to fixed bar top) |
| agent-C-00-states.mjs | logins, first wallet id /saku/b8904ac3-85f9-48fc-bf79-41b790c09d7d |
| agent-C-01-matrix.mjs light/dark [vps] | 15 route/auth cells x 8 viewports light, 3 viewports dark: scrollWidth vs clientWidth, offenders, bottom gap, load time; full-page shots at 320/375/1280, viewport shots elsewhere, bottom shots at 320/375 |
| agent-C-02-modals.mjs, 03-modes-resize.mjs, 04-emailclip.mjs | modals at 375x500 and 320x640, add-expense modes, resize while open |
| agent-C-05-style.mjs light/dark | computed-style census per route at 375x812 plus visible text |
| agent-C-06-shadow-palette.mjs | real card-shadow counts; palettes pink/blue/mono/hybrid/orange x light/dark |
| agent-C-07-large.mjs, 08-big.mjs | large role: list routes at 320/375/1280, monthly, search, archive expand-all, Rp 99.999.999 |
| agent-C-09-loading.mjs | CDP Network.emulateNetworkConditions (400 ms latency, 100 KB/s) |
| agent-C-10-empty-error.mjs | empty role routes and error routes |
| agent-C-11-i18n.mjs | id vs en text diff using the NEXT_LOCALE cookie |
| agent-C-12-splitbar.mjs, 13-nav.mjs | measurements at 320/375/430 |

Code reads: DESIGN.md, app/ui/Dialog.tsx, ModalOverlay.tsx, BottomNav.tsx, app/loading.tsx, utils/i18n/context.tsx, grep over app/. No repository file was modified.

## 3. Coverage table (route x viewport, light unless noted)
Criteria: no page horizontal scroll; nothing covered by the fixed bar at scroll end (lowest content bottom vs bar top; gap >= 0 in all 165 cells); no clipped primary action. PARTIAL at 320 means the bottom-nav label "Bandingkan" is truncated. The /split/new dark 320 cell is inferred from the light measurement (same markup). Full-page shots exist for 320, 375, 1280; every other cell has a viewport shot. Signed-out unknown routes redirect (307) to /?next=..., so no 404 page is shown signed-out.

| Route (auth) | 320x640 | 375x812 | 430x932 | 768x1024 | 1024x768 | 1024x1366 | 1280x800 | 1440x900 | dark 375 | dark 1280 | dark 320 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| / (out) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| /?auth=login (out) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| / (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /savings (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /saku (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /saku/WALLET (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /subscriptions (in) | FAIL (hscroll) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | FAIL (hscroll) |
| /split (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /split/new (in) | FAIL (CTA clipped 2px) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | FAIL (inferred) |
| /split/<id> (in) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| /split/<id> (out, friend view) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| /compare (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /archive (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /does-not-exist (in) | PARTIAL (nav label) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| /does-not-exist (out) | N/A (307 to /?next=) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

Load time on large data (lab, localhost production build, not CWV): / 0.79 to 0.98 s, /archive 0.53 to 0.62 s, /compare 0.45 to 0.51 s, /savings 0.88 to 1.02 s to the load event. Zero horizontal overflow across the 21 large-role route/viewport cells (C-data/large.json).

## 4. Checklist results
### Plan section 5, responsive checklist
- No unintended horizontal scroll: PARTIAL. FAIL only at /subscriptions 320 (338 px).
- No clipped, overlapping or unreachable content: PARTIAL. /split/new 320 CTA; /subscriptions 320 delete button; home summary values ellipsised (C-13).
- Text wraps without collisions: PARTIAL. Split viewer total breaks between "Rp" and the number (split-ID__1024x1366__light__vp.png).
- Primary actions visible and reachable: PASS except the 320 cases above.
- Fixed nav and Add do not cover content: PASS. Smallest gap above the bar at scroll end was 30 px (/split/new) and 56 px (home).
- Modals fit and scroll internally: PASS. 10 dialogs at 375x500 and 320x640 (C-data/modals.json). Add-expense standar mode at 375x500: scroller 778/459, submit at y 436-480 after scrolling.
- Forms usable with keyboard open: PARTIAL / UNVERIFIED. No real keyboard; 375x500 is a proxy. The Add-expense submit is not sticky (y 605-649 at 500 px high).
- Dense data narrow treatment: PASS. /compare chart and day tabs fit at 320.
- Adapts rather than scales: PARTIAL, see Design observations.
- Portrait and landscape tablet: PASS (768x1024, 1024x768, 1024x1366).
- Zoom 200% / text enlargement: UNVERIFIED.
- Safe area: PARTIAL / UNVERIFIED. env(safe-area-inset-bottom) appears in BottomNav.tsx:60, QuickAddExpense.tsx:790, SplitBillCreator.tsx:1503, Dialog.tsx:128. The served meta is "width=device-width, initial-scale=1" with no viewport-fit=cover, so on notched devices those env() values resolve to 0 (browser letterboxing applies instead). No real-device check.

### 6.1 visual and design system (light, 375x812, typical)
- Primary focal point: PASS on home ("Sisa hari ini"), /savings, /compare. PARTIAL on /split (three tinted stat cards and a black CTA compete) and /split/new (five numbered cards).
- Type scale: PASS. 0 text under 12 px on every route (style-light.json), 0 text-[9..11px] in app/. Sizes 12,14,16,18,20,24,30,36. One font (Plus Jakarta Sans) plus ui-monospace for the account number.
- Colours tokenised: PARTIAL. Home yes; other routes use raw palette classes (C-04).
- Contrast: out of my scope.
- Radii: PARTIAL. Seen: 12px, 16px, full, plus 24px (26 elements, dialogs), 8px (34), 6px (10), 2px (14). DESIGN.md allows 12/16/full. Code has 38 rounded-3xl.
- Shadows on cards: FAIL on 9 of 10 routes (home is clean). Elements with a visible shadow besides the nav: /split/new 12, /saku 10, /split 9, /subscriptions 7, /archive 6, /compare 5, /savings 3, split viewer 2, wallet detail 2. Values include shadow-xs, shadow-sm, shadow-lg, shadow-xl.
- Blur: PASS live (0 backdrop-filter), 3 blur uses remain in code (C-05).
- Gradients: PASS in light (0 elements on all routes), FAIL in dark on /archive (1 element).
- Icons: PARTIAL. Lucide, mostly relevant. Sparkles is used 36 times in code (Audit 001 said 31) and shows live as the "Integrasi Otomatis" icon on /split/new. DESIGN.md says no sparkle icons.
- Receipt-edge motif used once: PARTIAL. The torn edge (.receipt-edge) is on one element (DashboardClient.tsx:502). The .receipt drop-shadow wrapper is also on /compare (page.tsx:270) and /savings (SavingsClient.tsx:301).
- Palettes pink/blue/mono/hybrid: PASS. Add button and surfaces recolour in light and dark (home__375x812__{light,dark}__palette-*.png). Hybrid resolved to the mono scheme at audit time.
- Empty/loading/error coherence: PARTIAL (see States).
- Dark and light intentional: PASS on home; dark gradients remain on /archive and ProjectedBurnCard.
- One-off colours: FAIL. Teal rgb(13,148,136) and emerald-500 rgb(16,185,129) backgrounds on /saku and wallet detail; green rgb(55,143,89) on /split and /compare. Distinct text colours per route: 3 (home) to 15 (split viewer); distinct backgrounds 2 to 13. Aggregate over 11 signed-in routes: 24 text colours, 43 background strings, 6 weights, 2 font families.

### 6.5 content and localization (default Indonesian)
- Primary language consistent: PARTIAL (C-06, C-07).
- Terminology understandable: PARTIAL ("burn rate", "Pacing", "One-Off", "PB1", "PPN", "Nett", "Real-Time").
- Currency format: PASS. Every amount uses "Rp 1.234.567" with dot separators and no decimals; no "IDR", "Rp15000" or comma forms appear in either language. The currency picker lists "IDR (Rp)" by design.
- Dates and periods: FAIL (C-08).
- Technical terms exposed: PARTIAL. DeepSeek/BYOK text exists only in AiAssistantSheet.tsx:436, shown when a personal key is used.
- Empty states and errors: PARTIAL (C-12).
- Placeholder/debug strings: PASS on the screens tested. The quick-bar placeholder "e.g. 'Makan siang 25k'..." is English.
- Implied result unsupported: PARTIAL ("Kamu lebih hemat ~Rp 0 per hari" on an empty /compare).
- Em dashes: none in rendered text of any route; en dashes are used in date ranges.
- Exclamation marks on system copy: 3 found (C-07).

### States
- Empty (role empty): / PARTIAL (no call to action in the empty box); /savings PASS (explains, "Buat Target Tabungan"); /saku PASS (explains Multi-Saku, offers activation); /subscriptions PASS ("Tambah Langganan" plus examples); /split PASS ("Buat Split Bill Baru"); /compare PARTIAL (zero cards and a misleading line); /archive PASS (explains when entries appear).
- Loading: PASS for theme (Audit 001 #8). Light and dark skeletons use theme tokens (body rgb(26,19,13) in dark with matching pulse blocks). PARTIAL for shape (C-11).
- Error: /does-not-exist signed-in is a themed 404 page with "Ke Beranda": PASS. /split/<unknown> and /saku/<unknown> show the same page with HTTP 200 (C-10).

## 5. Findings

### [C-01] /subscriptions overflows horizontally at 320px
- Status: FAIL
- Priority: P2
- Category: Responsive
- Confidence: Verified live
- Route: /subscriptions · Viewport: 320x640 · Theme: light and dark · Auth state: typical
- Expected: Responsive checklist (no horizontal page scroll); WCAG 1.4.10 Reflow at 320 CSS px.
- Actual: documentElement.scrollWidth 338 vs 320. The action row of a subscription card ("Bayar", pause, edit, delete) is 18 px wider than the viewport (delete icon right edge at 338). The date wraps ("2026-12-" / "02"), and the 320-wide bottom nav is narrower than the scrolling page.
- Repro steps: 1. Sign in as a user with 2 subscriptions. 2. Open /subscriptions at 320x640. 3. Look at the iCloud card or scroll right.
- User impact: Edit and delete sit partly off-screen on the smallest phones and the page pans sideways.
- Evidence: out/shots/C/subscriptions__320x640__light__full.png; C-data/matrix-all.json (sw 338, offenders "div.flex items-center gap-1 shrink-0 right=338", "button.p-1.5 text-rose-500 right=338").
- Acceptance criteria:
  - [ ] scrollWidth equals clientWidth at 320 on /subscriptions with 2 or more subscriptions
  - [ ] All four card actions are fully visible without horizontal scroll

### [C-02] /split/new floating total bar: "Publikasikan" overflows the bar at 320px
- Status: FAIL
- Priority: P3
- Category: Responsive
- Confidence: Verified live
- Route: /split/new · Viewport: 320x640 · Theme: light (dark inferred) · Auth state: typical
- Expected: The primary action sits fully inside its container and the viewport.
- Actual: bar x 85 to 322 inside a parent at 12 to 308; the button spans 195 to 322, so it exceeds the card (308) and the viewport (320). Button height 36 px. At 375 it fits (button 219-346, bar 108-346).
- Repro steps: 1. Open /split/new at 320x640. 2. Look at the bottom bar.
- User impact: The page's primary action touches or clips at the screen edge on the smallest phones.
- Evidence: out/shots/C/split-new__320x640__light__bottom.png; agent-C-12-splitbar.mjs output {"btn":[195,322],"bar":[85,322],"ancestors":[[85,322],[12,308],[0,320]]}.
- Acceptance criteria:
  - [ ] At 320 px the button's right edge is within the bar's inner edge
  - [ ] "Total Tagihan" and its amount do not wrap awkwardly

### [C-03] 320px: bottom-nav label and header date are ellipsised
- Status: PARTIAL
- Priority: P3
- Category: Responsive
- Confidence: Verified live
- Route: all signed-in routes with the bottom nav · Viewport: 320x640 · Theme: both · Auth state: typical
- Expected: Labels readable (DESIGN.md bottom bar).
- Actual: "Bandingkan" renders "Banding..." (62 px item, scrollWidth greater than clientWidth). The home date "Jumat, 13 Nov" is also truncated next to the streak chip. Nothing truncates at 375 or 430.
- Repro steps: 1. Open / at 320x640.
- User impact: Minor; destinations remain recognisable by icon.
- Evidence: agent-C-13-nav.mjs output ("Bandingkan" trunc true at 320 only); out/shots/C/saku-WALLET__320x640__light__bottom.png.
- Acceptance criteria:
  - [ ] All five nav labels fully visible at 320 px

### [C-04] Design-system drift outside the home screen: legacy palette, card shadows, off-scale radii
- Status: FAIL
- Priority: P2
- Category: Visual
- Confidence: Verified live and in code
- Route: /saku, /saku/<id>, /subscriptions, /split, /split/new, /split/<id>, /compare, /archive, /savings · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: DESIGN.md: semantic tokens only (paper, card, ink, line, accent, ok), radius 12/16/full, no card shadows, one accent.
- Actual: legacy palette classes remain widely. Class counts in app/ (grep): QuickAddExpense 175, SplitBillCreator 134, SubscriptionsClient 109, AiAssistantSheet 104, ImageUploadModal 87, SavingsClient 86, DailyTrendComparison 72, SplitBillViewer 65. Family totals: emerald 356, teal 259, amber 243, rose 202, purple 82, blue 47, orange 24, indigo 22, pink 11. Live: teal and emerald-500 backgrounds on /saku, an indigo card on /subscriptions, shadow-xs on cards (counts in section 4), 24/8/6/2 px radii.
- Repro steps: 1. Compare / with /saku or /subscriptions at 375x812 and inspect computed background-color, box-shadow and border-radius.
- User impact: The Warung identity holds only on home; other screens look like a different product.
- Evidence: C-data/style-light.json, C-data/shadows.json; shots saku__375x812__light__full.png, subscriptions__375x812__light__full.png, split__375x812__light__full.png vs home__375x812__light__full.png.
- Acceptance criteria:
  - [ ] No zinc/emerald/teal/indigo utility classes in routed pages (token names only)
  - [ ] Radii limited to 12, 16 and full
  - [ ] No box-shadow on cards; only the nav shadow

### [C-05] Phase-gate open items confirmed: gradients and blur remain
- Status: FAIL
- Priority: P3
- Category: Visual
- Confidence: Verified in code; dark /archive verified live
- Route: dashboard modules, /archive, /savings, email banner, image upload · Theme: light and dark
- Expected: DESIGN.md "Blur: none"; no decorative gradients.
- Actual (path:line): AiAdvisorCard.tsx:91 (bg-linear teal) and :94 (blur-2xl glow); TrackingStreak.tsx:94 (blur glow), :128 and :196 (bg-gradient-to-tr amber/orange); ProjectedBurnCard.tsx:61 and archive/page.tsx:179 (dark: variants of bg-linear-to-b); SavingsBalanceHistory.tsx:303 (bg-linear in light and dark); PendingTransactionsBanner.tsx:110 (bg-gradient amber); ImageUploadModal.tsx:841 (backdrop-blur-[1px]). Live: 0 gradient elements in light on every route; 1 in dark on /archive. UserMenu.tsx:74 uses a conic-gradient for the hybrid palette swatch, which is a swatch rather than decoration. Audit 001's 38 backdrop-blur uses are down to 1.
- Repro steps: 1. Set THEME=dark and open /archive; read the first stat card's background-image. 2. The streak popover, AI advisor card and ProjectedBurnCard were not rendered by me, so those are code-confirmed only.
- User impact: Decorative effects contradict the stated direction; low functional impact.
- Evidence: grep output; C-data/style-dark.json (/archive grad 1).
- Acceptance criteria:
  - [ ] No gradient, blur or glow classes in app/ except the palette swatch

### [C-06] Leftover English and jargon in the Indonesian UI
- Status: FAIL
- Priority: P3
- Category: Content
- Confidence: Verified live
- Route: /subscriptions, /split, /split/new, /compare, home over-budget card, account menu · Viewport: 375x812 · Theme: light · Auth state: typical, large
- Expected: 6.5 consistent primary language; DESIGN.md voice "Bahasa first, no finance jargon".
- Actual (strings seen): "Entertainment", "Utilities" (subscription cards), "Food & Dining" (split list); category select on /split/new "Food & Dining, Transportation, Utilities, Academics, Entertainment, Others"; "Pacing ~Rp 9.314 lebih boros per hari" (/compare); "burn rate" and "Real-Time" (/split/new); "Mau tandai sebagai One-Off?" (home, large role); "Scan Struk", "Tunai (Cash)", "Service Charge (%)", "Nett", "PB1", "PPN"; menu "Budget Mingguan", "Deteksi Email QRIS", "Fitur Asisten AI"; placeholder "e.g. 'Makan siang 25k'..." in the Add-expense quick bar.
- Repro steps: 1. Open each route with default language.
- User impact: Mixed-language UI and unexplained terms for students.
- Evidence: C-data/style-light.json (text), C-data/i18n-text.json.
- Acceptance criteria:
  - [ ] No English-only strings in Indonesian mode except brand and bank names
  - [ ] Tax and fee terms carry a short Indonesian explanation

### [C-07] Voice: "Anda" vs "kamu", exclamation marks, misleading zero claim
- Status: FAIL
- Priority: P3
- Category: Content
- Confidence: Verified live
- Route: /, /split, /split/new, /saku, /compare · Auth state: typical, empty, signed-out
- Expected: DESIGN.md voice: casual and short, no exclamation marks on system copy; 6.5 copy must not imply an unsupported result.
- Actual: formal "Anda" on the guest landing, /split ("tagihan yang Anda buat"), /split/new, /saku ("target impian Anda"), while home says "kamu". Exclamation marks: "Selamat Datang di SakuTrack!" (signed-out /), "Target terlampaui? Wajar terjadi!" (over-budget card), "Kamu lebih hemat ~Rp 0 per hari sejauh ini!" on /compare for an empty account (claims saving with no data).
- Repro steps: 1. Open / signed-out. 2. Open /compare as the empty role.
- User impact: Inconsistent tone; one line makes a financial claim with no data.
- Evidence: C-data/empty-error.json (compare@375x812); shots empty-compare__375x812__light__full.png, home-out__375x812__light__full.png.
- Acceptance criteria:
  - [ ] One second-person form app-wide
  - [ ] No "!" in system copy
  - [ ] /compare shows a neutral message when there is no data

### [C-08] Dates and periods use five formats
- Status: FAIL
- Priority: P3
- Category: Content
- Confidence: Verified live
- Route: /subscriptions, /split, /archive, /compare, /savings, / · Auth state: typical
- Expected: 6.5 dates localised consistently (Indonesian day-month order).
- Actual: ISO "2026-11-16" and "2026-12-02" (subscriptions, split recurring, "3 hari lagi (2026-11-16)"); "13 Nov 2026 · 3 orang"; "Jumat, 13 November 2026"; archive "Nov 2 – Nov 8, 2026" and "Okt 19 – Okt 25, 2026" (month first); compare "Nov 9 – Nov 15"; home "9 Nov - 15 Nov" (hyphen); savings "13 Nov 2026, 02:00".
- Repro steps: 1. Open the listed routes.
- User impact: Reads as unfinished; ISO dates are unfriendly.
- Evidence: C-data/style-light.json text for each route.
- Acceptance criteria:
  - [ ] One date helper; ranges render like "2 - 8 Nov 2026"
  - [ ] No ISO strings visible

### [C-09] English mode leaves Indonesian strings
- Status: PARTIAL
- Priority: P3
- Category: Content
- Confidence: Verified live (cookie NEXT_LOCALE=en set in my own context)
- Route: /saku, /saku/<id>, Add-expense dialog, /split/new, /subscriptions, /archive · Auth state: typical
- Expected: All strings follow the selected language.
- Actual: /saku keeps "Transfer Saku", "Saku Belanja", "Sisa Rp", "Buka Catatan Belanja", "Pos simpanan & target impian Anda", "Kelola Tabungan & Target". Wallet detail is fully Indonesian ("Terpakai Minggu Ini", "Total Transaksi", "Pengeluaran di Saku Ini"). Add-expense keeps "Upload Foto", the quick-chip names and "Dompet Utama". /split/new keeps "Scan Struk", "Tunai (Cash)" and English categories. Archive range "Nov 2 – Nov 8, 2026". The language toggle is a cookie plus router.refresh() (utils/i18n/context.tsx:59), so I did not use the menu toggle.
- Repro steps: 1. Set NEXT_LOCALE=en. 2. Open /saku.
- User impact: English users see a half-translated app.
- Evidence: C-data/i18n-text.json (en keys); home__375x812__light__lang-en.png.
- Acceptance criteria:
  - [ ] No Indonesian-only strings on /saku, /saku/<id> and Add-expense when the locale is EN

### [C-10] Soft 404: unknown /split/<id> and /saku/<id> return HTTP 200
- Status: FAIL
- Priority: P3
- Category: Reliability
- Confidence: Verified live
- Route: /split/00000000-0000-0000-0000-000000000000 (curl 200 signed-out, Playwright 200 signed-in); /saku/00000000-0000-0000-0000-000000000000 (200 signed-in) · Auth state: both
- Expected: 404 status with the not-found UI (signed-in /does-not-exist correctly returns 404).
- Actual: the right content ("Halaman tidak ditemukan", "Ke Beranda") with status 200. The /split not-found page has no bottom nav; the /saku one has.
- Repro steps: 1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/split/00000000-0000-0000-0000-000000000000
- User impact: Monitoring and crawlers cannot tell; trivial for people.
- Evidence: C-data/empty-error.json status fields; curl output 200.
- Acceptance criteria:
  - [ ] Unknown ids return 404

### [C-11] Loading: no route-specific skeleton for /split, /saku, /saku/<id>, /split/<id>
- Status: PARTIAL
- Priority: P3
- Category: UX
- Confidence: Verified live and in code
- Route: /split, /saku · Theme: light and dark
- Expected: Skeleton resembles the page (Audit 001 #8 complained about wrong shape).
- Actual: colours are now correct in both themes. loading.tsx exists only for /, /savings, /subscriptions, /archive, /compare; /split and /saku use app/loading.tsx (home-shaped: heading, large card, list rows).
- Repro steps: 1. Throttle the network. 2. Tap Patungan in the bottom bar.
- User impact: Slight layout jump when real content arrives.
- Evidence: loading-split-clientnav__375x812__{light,dark}__skeleton.png, loading-compare-clientnav__375x812__light__skeleton.png; agent-C-09 output ("busy":true on /split and /saku).
- Acceptance criteria:
  - [ ] /split and /saku show a skeleton matching their layout

### [C-12] Empty home and empty compare do not say what to do next
- Status: PARTIAL
- Priority: P3
- Category: UX
- Confidence: Verified live
- Route: / and /compare · Auth state: empty
- Expected: 6.5 empty states explain what the user can do.
- Actual: home shows "Belum ada pengeluaran yang dicatat minggu ini." in a dashed box followed by three stat rows ("Rata-rata Harian Rp 0", "Kategori Teratas: Tidak ada · Rp 0", "Terbesar: Tidak ada"); the only prompt is the + in the bar. /compare shows all-zero cards and the misleading line from C-07.
- Repro steps: 1. Sign in as the empty account. 2. Open / and /compare.
- User impact: A new user gets no explicit first step.
- Evidence: out/shots/C/empty-home__375x812__light__full.png.
- Acceptance criteria:
  - [ ] Empty home names the action (for example "Catat pengeluaran pertamamu") and hides zero-value stat rows

### [C-13] Home summary rows truncate the figure instead of the name
- Status: PARTIAL
- Priority: P3
- Category: Responsive
- Confidence: Verified live
- Route: / · Viewport: 375x812 and 320x640 · Auth state: typical, large
- Expected: Key figures stay readable.
- Actual: "Kategori Teratas  Tagihan & Kebutuhan · Rp ..." loses the amount to an ellipsis; "Terbesar  [A002] Langganan software desai..." truncates the name. Rp 99.999.999 does render fully at 320 (the amount wins, the item name is cut to "[A002] Ite..."), which is a reasonable trade.
- Repro steps: 1. Open / at 375x812 and scroll to the summary card under the list.
- User impact: Minor loss of information.
- Evidence: home__375x812__light__full.png, large-home__375x812__light__full.png, large-bigamount-archive__320x640__light__vp.png.
- Acceptance criteria:
  - [ ] The amount in the summary rows is never truncated; truncate the name instead

### [C-14] Archive grows without bound when weeks are expanded
- Status: PARTIAL
- Priority: P3
- Category: Performance
- Confidence: Verified live
- Route: /archive · Viewport: 375x812 · Auth state: large
- Expected: Dense lists have an intentional narrow-screen treatment.
- Actual: collapsed 4,429 px tall; after expanding all 25 weeks (600 entries) 26,629 px and 4,304 DOM nodes; the 25 clicks took 2.3 s (lab). No horizontal overflow. Audit 001 #45 reported 7,877 px. Height scales linearly with data and there is no per-week cap or windowing. Expansion is opt-in.
- Repro steps: 1. Sign in as the large account. 2. Open /archive and use "Buka semua".
- User impact: Long scroll, heavier DOM on low-end phones.
- Evidence: C-data/large.json (archive); large-archive-expanded__375x812__light__vp.png.
- Acceptance criteria:
  - [ ] Expanded weeks cap or paginate entries (for example 20, then a "Lihat semua" row)

## Design observations (not defects)
- Desktop and tablet: at 768, 1024 and 1440 the app is a single centred column 416 to 448 px wide on the paper background, with the bottom bar stretched full width and its five items centred in the same column (home__1280x800__light__full.png). This matches DESIGN.md ("one column, max width 448px") and looks intentional. At 1024x1366 portrait the split viewer is a phone layout floating in a lot of empty space (split-ID__1024x1366__light__vp.png). A wider layout would be a product decision.
- Primary button colour: /split, /split/new and /subscriptions use a dark ink fill for the primary action ("Split Baru", "Tambah", "Publikasikan") while home uses tangerine for Add. DESIGN.md reserves the accent for the one primary action. The /split stat cards are tinted orange and green.
- The Add-expense submit is not sticky; on short viewports it sits below the fold of its internal scroller.
- Full-page screenshots at 375 draw the fixed bar mid-page; that is a capture artefact.
- The torn receipt edge on the home summary is distinctive and used once.

## 6. Audit 001 cross-check
| # | Item | Status | Evidence |
|---|---|---|---|
| 8 | Loading skeletons dark-only | FIXED (colour), PARTIAL (shape) | token skeletons verified in light and dark; /split and /saku share a home-shaped one (C-11) |
| 11 | No design direction | FIXED | DESIGN.md exists; tokens used on home |
| 12 | Sparkles icon 31 times | STILL PRESENT | 36 Sparkles and 6 Zap usages in app/; sparkle icon live on /split/new |
| 13 | Uppercase wide-tracked 10-11px labels | FIXED | 0 text under 12 px live; 0 text-[9..11px] and 0 "uppercase" in app/ |
| 14 | Gradients and glow | STILL PRESENT | C-05 |
| 15 | backdrop-blur 38 uses | FIXED (1 left) | ImageUploadModal.tsx:841; 0 live backdrop-filter |
| 16 | Capsule badges DeepSeek/BYOK | PARTIAL | conditional string at AiAssistantSheet.tsx:436 only; not on tested routes |
| 17 | Arrows on buttons | STILL PRESENT (1) | "Kelola →" on /split; the other arrows are gone |
| 18 | Welcome = three-card template | FIXED | guest landing is a short list plus two buttons; exclamation mark remains (C-07) |
| 19 | 14 colour families | STILL PRESENT | family counts in C-04; home clean |
| 20 | Pill shapes everywhere | PARTIAL | tabs and cards use 12/16; full-radius still on chips and badges (46 elements counted) |
| 21 | No identity | FIXED on home | receipt edge, paper/ink palette |
| 22 | Dark is default | FIXED | utils/theme/server.ts:11 falls back to "light" |
| 23 | Text under 12px | FIXED | 0 live, 0 in code |
| 40 | Dashboard buries the list | FIXED | "Entri Terbaru" and 2 rows are in the first screen at 375x812 |
| 41 | Three fixed bottom layers | FIXED | one bar with a raised Add button, no gradient; min gap 30-56 px |
| 42 | Five routes to AI | FIXED on home | one header chat button |
| 43 | Savings page about 20 figures | UNVERIFIED | not counted |
| 44 | Header wraps at 375 | FIXED at 375, PARTIAL at 320 | date ellipsised at 320 (C-03) |
| 45 | Archive 7,877 px expanded | STILL PRESENT | 26,629 px with 600 entries (C-14); opt-in |

## 7. Strengths observed
- Home hierarchy: one dominant "Sisa hari ini" number with a short status line and progress bar (home__375x812__light__full.png).
- No horizontal overflow on any of the 21 large-data cells; Rp 99.999.999 fits at 320 (large-bigamount-archive__320x640__light__vp.png).
- Modals behave at 375x500 and 320x640: they fit, scroll internally and keep the close button reachable. Resizing with a dialog or the menu open keeps focus inside and the layout valid.
- Palettes switch cleanly in both themes (10 palette screenshots).
- The dark theme is warm brown and deliberate, not an inverted grey.
- Skeletons use tokens and motion-safe.
- Currency formatting is uniform "Rp" with dot separators.
- The signed-out friend view of a split bill works at every viewport with no overflow.

## 8. Not tested / limitations
- Browser zoom 200% and text-only enlargement: UNVERIFIED.
- Real on-screen keyboard and real safe-area devices: UNVERIFIED (375x500 is a proxy).
- Throttling was mild (400 ms, 100 KB/s); hard navigations were mostly past the skeleton by the 900 ms screenshot, so skeletons were captured via client-side navigation.
- Streak popover, AI advisor card and ProjectedBurnCard were not rendered; their gradients are code-confirmed only.
- Dark mode at 430, 768, 1024, 1440 not run (dark covered at 320, 375, 1280).
- /split/new dark 320 inferred from the light measurement.
- Text under 12 px inside dialogs not scanned (route-level only).
- Audit 001 #43 not assessed.
- Login states for empty and typical went stale mid-run (likely other agents' sessions); affected scripts were re-run after a fresh login.
