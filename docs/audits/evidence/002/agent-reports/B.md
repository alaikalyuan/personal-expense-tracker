# Agent B: Accessibility (WCAG 2.2 AA + WAI-ARIA APG), Audit 002

Commit a66510c, production server http://localhost:3100. Playwright 1.65.0 (headless Chromium), axe-core 4.13.0. All contexts `hasTouch + isMobile`, so `(pointer: coarse)` matched (verified: `coarse=true` in every target run). Default viewport 375x812, light and dark. Roles: `typical`, `empty`, signed-out. No screen reader available: all screen-reader behaviour is UNVERIFIED. Automated axe covers only a fraction of WCAG; the results below are partial by nature.

No data was created, edited or deleted. Native `confirm()` dialogs (subscription delete, goal delete, Saku archive) were auto-dismissed by Playwright; I re-read `/subscriptions`, `/savings`, `/saku` and the split bill afterwards and all `[A002]` data was intact. The only server call that was not a page load was one sign-in with the non-existent account `audit002-nobody@sakutrack.test` and a wrong password.

## 1. Summary

- Big improvement over Audit 001: a shared `Dialog`/`ModalOverlay` gives role=dialog, aria-modal, an accessible name, Escape, Tab wrap and focus restore to 19 of 24 dialogs tested. Pinch zoom, reduced motion, 12px+ text, 44px targets (via coarse-pointer hit areas) and the login labels are all fixed.
- Remaining serious barriers: the AI assistant sheet has no focus management or trap (21 of 30 Tab presses leave it); focused list rows and links are fully hidden behind the fixed bottom nav/FAB (WCAG 2.4.11); many form fields and icon buttons still have no programmatic label/name (axe critical `label`, `select-name`, `button-name` in 12 dialogs and `/split/new`, `/split/<id>/edit`).
- Other defects: Escape does nothing in the split QR dialog and split delete-confirm; `/saku`, `/saku/<id>`, `/subscriptions` have no `<main>`; 11 of 12 route titles are identical; selected state of pickers is colour-only; input borders are 1.18 to 1.31:1; horizontal scroll at 320px on 3 routes; auth errors are not announced and there is no forgot-password or show-password.
- The lead's observation that the login email/password fields expose only a placeholder and the submit button has no name is NOT reproduced on this build (section 5, B-18).
- 17 findings (B-01..B-17): 3 at P1, 9 at P2, 5 at P3.

## 2. What I ran

All scripts are in `SCRATCH/tools/agent-B-*.mjs` (run from `SCRATCH/tools`), raw outputs in `SCRATCH/out/B-*.json|log|txt`, screenshots in `SCRATCH/out/shots/B/`.

| Script | Purpose | Output |
|---|---|---|
| `agent-B-axe-routes.mjs` | axe on 12+ routes x light/dark x signed-out/typical/empty, plus title/lang/h1/landmark per route | `B-axe-routes.json` |
| `agent-B-dialogs.mjs`, `-dialogs2.mjs` (light, dark; 2nd file re-run for items the first run missed) | per-dialog: role/name, initial focus, Tab x30 and Shift+Tab x30, Escape, focus return, close buttons, unnamed fields/buttons, axe with dialog open, screenshot | `B-dialogs-*.json`, `B-dialogs2-*.json`, `B-dialogs3-light.json` |
| `agent-B-auth.mjs` | signed-out keyboard auth flow, labels, error association, forgot/show password | `B-*` stdout (quoted below) |
| `agent-B-semantics.mjs`, `-aria2.mjs` | `ariaSnapshot()` of dashboard, add dialog (quick, standard), subscription dialog, login dialog | `B-aria-dashboard.txt`, `B-aria-dialogs.txt` |
| `agent-B-keyboard.mjs`, `-kb2.mjs`, `-kb3.mjs` | Tab order, computed focus ring on 19 stops, focus obscured by fixed nav | `B-tabstops-light.json`, shot `wcag-2411-obscured-focus.png` |
| `agent-B-journeyH.mjs`, `-req.mjs` | keyboard-only workflow, disclosures, required/labels per dialog | stdout |
| `agent-B-contrast.mjs`, `-nontext.mjs` | own contrast scan of all text nodes (light/dark, 3 palettes), non-text contrast samples | `B-contrast.json` |
| `agent-B-targets.mjs` | rendered size, 24px spacing exception, effective hit area via `elementFromPoint` grid probe | `B-targets.json` |
| `agent-B-reflow.mjs`, `-shots320.mjs` | 320x640 and 640x400 on 15 routes, 4 dialogs, text-spacing override | `B-reflow.json`, shots `reflow*` and `textspacing-*` |
| `agent-B-motion.mjs` | `reducedMotion` no-preference vs reduce | stdout |
| `agent-B-misc.mjs`, `-sanity.mjs` | viewport meta, sub-12px text, data-intact check | stdout |

Known script caveats: the first `dialogs` pass hit "strict mode" locator errors on 3 items and a 30s timeout cascade on later items (likely load from parallel runs); I re-ran them separately and report the re-run. My "focus returns to invoker" check marks the invoker with a `data-b-inv` attribute and checks `document.activeElement` after Escape. Dialog open used keyboard Enter on the focused invoker.

## 3. Coverage table

Status per cell: P = pass (no automated violation found), F = violation (see findings), n/a. Axe is automated and partial.

| Route / state | axe light | axe dark | title unique | h1 + landmarks | 320x640 reflow | targets (coarse) |
|---|---|---|---|---|---|---|
| signed-out `/` (welcome) | P | P | F (generic) | P (h1, main, header) | P | P |
| `/?auth=login` dialog | P | P | F | PARTIAL (h3 only, no h1 behind it) | P | P (eff 44) |
| `/` typical | P | P | F | P | P | P |
| `/savings` | P | P | F | P | P | P |
| `/saku` | F landmark-one-main, region(12) | same | F | F (no `<main>`) | P | P |
| `/saku/<id>` | F landmark-one-main, region(24) | same | F | F (no `<main>`, 24 headings) | P | P |
| `/subscriptions` | F landmark-one-main, region(10) | same | P ("Langganan Digital : SakuTrack") | F (no `<main>`) | F (scroll 347px) | PARTIAL (14 under 44, 4 effective) |
| `/split` | F heading-order(1) | F | F | P | P | PARTIAL |
| `/split/new` | F label(1) critical, select-name(2) critical, color-contrast(1) | F label, select-name | F | P | F (scroll 344px) | F (39 under 44, 17 effective) |
| `/split/<id>` signed in | F color-contrast(1) | P | F | P | P | P |
| `/split/<id>` signed-out friend | F color-contrast(1) | P | F | P | P | P |
| `/split/<id>/edit` | F label(1), color-contrast(1) | F label | F | P | F (scroll 390px) | F (65 under 44, 26 effective) |
| `/compare` | F color-contrast(2), heading-order(1) | F same | F | P | P | P |
| `/archive` | P | P | F | P | P | PARTIAL |
| `/does-not-exist` signed in | P | P | F | P | P | n/a |
| `/does-not-exist` signed out | P (redirects to `/?next=...`, HTTP 200, shows welcome) | P | F | P | P | n/a |
| `empty` role: `/`, `/savings`, `/archive` | P | P | F | P | not run (320 run was typical/signed-out only) | not run |
| `empty` `/saku`, `/subscriptions` | F landmark+region(3) | same | see above | F | UNVERIFIED | UNVERIFIED |
| `empty` `/split`, `/compare` | F heading-order(1) / contrast(2)+heading-order | same | F | P | UNVERIFIED | UNVERIFIED |

Dialog matrix (typical, 375x812, opened by keyboard Enter on the invoker; Tab x30 / Shift+Tab x30 = count of presses where focus left the dialog or went to body):

| Dialog | role=dialog + name | Initial focus | Tab fwd / back leaks | Escape closes | Focus returns to invoker | Background inert/aria-hidden | Close button named (size) | axe with dialog open (light) |
|---|---|---|---|---|---|---|---|---|
| Account menu | yes, aria-modal; name "Buka menu" (= the invoker's label, weak) | Close button | 0 / 0 | yes | yes | no (aria-modal only) | "Tutup" 44x44 | none |
| Add: Ketik Cepat | yes "Tambah pengeluaran" | text input | 0 / 0 | yes | yes | no | "Tutup" 28x28 (eff 44) | label(1): "Tetap buka" checkbox unnamed |
| Add: Standar | yes | amount field | 0 / 0 | yes | yes | no | same | none |
| Add: Upload Foto | nested 2nd dialog "Upload Foto - Catat Pengeluaran" | dialog container | 0 / 0 | yes (closes topmost; outer stays, focus to outer "Upload Foto" tab) | n/a (nested) | no | "Close" (English, hard-coded) 28x28 | none |
| Edit expense | yes "Ubah pengeluaran" | first input | 0 / 0 | yes | yes | no | "Tutup" 44x44 | none |
| AI assistant sheet | yes "Asisten Keuangan AI" | NOT moved: stays on invoker behind the sheet | **21 / 21 (FAIL)** | yes (window listener) | yes (never moved) | no | "Tutup" 32x32 | none |
| Export / share | yes "Bagikan & Ekspor" | container | 0 / 0 | yes | yes | no | "Tutup" 24x24 (eff 44) | none |
| Streak | yes "Logging Streak" | container | 0 / 0 (1 focusable) | yes | yes | no | close has NO name, 24x24 | button-name(1), heading-order(1) |
| Goal create / edit | yes | container | 0 / 0 | yes | yes | no | close has NO name 16x16 | button-name(1) |
| Goal allocate / withdraw | yes (name begins with emoji) | container | 0 / 0 | yes | yes | no | close NO name 16x16 | button-name(1), label(1) |
| Move to savings | yes | container | 0 / 0 | yes | yes | no | close NO name 16x16 | button-name(1), label(1) |
| Savings balance | yes | container | 0 / 0 | yes | yes | no | close NO name 16x16 | button-name(1) |
| Saku create / edit | yes | container | 0 / 0 | yes | yes | no | close NO name 36x36; 10 unnamed buttons (emoji/colour pickers) | button-name(10), label(1), region(12) |
| Saku transfer | yes | container | 0 / 0 | yes | yes | no | close NO name 36x36 | button-name(1), label(1), select-name(2), region(12) |
| Saku income | yes | container | 0 / 0 | yes | yes | no | close NO name 36x36 | button-name(1), label(1), select-name(1), region(12) |
| Subscription add | yes "Tambah Langganan Baru" | container | 0 / 0 | yes | yes | no | "Batal" 24x24 | label(2), select-name(3), region(10) |
| Subscription edit | yes "Edit Langganan" | container | 0 / 0 | yes | yes | no | "Batal" 24x24 + unnamed 12x12 | button-name(1), label(2), select-name(3), region(10) |
| Split QR | yes "Pindai Kode QR" | container | 0 / 0 | **NO** | **NO** | no | "Tutup" 293x36 | color-contrast(1) |
| Split delete confirm | yes "Hapus Split Bill Ini?" | container | 0 / 0 | **NO** | **NO** | no | "Batal" 62x32 | color-contrast(1) |
| Budget edit (menu) | yes "Budget Mingguan" | input | 0 / 0 | yes | focus goes to header "Buka menu" (menu closed; reasonable) | no | "Tutup" 44x44 | none |
| Notifications (menu) | yes "Notifikasi & Pengingat PWA" | container | 0 / 0 | yes | to "Buka menu" | no | "Tutup" 24x24 | heading-order(1), label(4): time input and 3 checkboxes unnamed |
| Email sync (menu) | yes "Catat otomatis dari email Livin'" | Close button | 0 / 0 | yes | to "Buka menu" | no | "Tutup" 44x44 | none |
| Login dialog (signed-out) | yes, aria-labelledby resolves to "Selamat Datang Kembali" | container | 0 / 0 in a 14-press run | yes | no invoker (direct URL), focus to body | not tested | "Tutup" 24x24 (eff 44) | none (Masuk and Buat Akun) |
| Delete confirms (sub, goal) and Saku archive | native `confirm()` | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

Dark mode: dialogs matrix identical except split QR and split delete-confirm contrast (light only). All dialogs were also screenshotted open (`shots/B/dlg-<name>-light|dark.png`).

## 4. Checklist results (plan 6.3, 6.4, Journey H)

### 6.3 Structure and semantics
- Meaningful titles: FAIL. 11 of 12 routes use "SakuTrack : Student Budget Tracker"; only `/subscriptions` has its own (verified live, B-07).
- Heading hierarchy: PARTIAL. Every page has exactly one h1 except `/?auth=login` (h3 only). axe `heading-order` on `/split`, `/compare`, streak and notification dialogs. `/saku/<id>` has 22 consecutive h3 (B-14).
- Landmarks: PARTIAL. `main`, `header`, `nav[Navigasi utama]` present on most routes; no `<main>` on `/saku`, `/saku/<id>`, `/subscriptions` (B-06). No skip link (landmarks mitigate).
- Controls have accessible names: FAIL for dialogs listed in B-04; PASS for dashboard, savings, split viewer, archive, compare (axe clean).
- Form labels associated: FAIL. Counted live in dialogs: subscription add 7 `<label>` and 0 linked, goal create 3 and 0, add-standard 0 `<label>` (fields named by placeholder only: "0", "Nama pengeluaran"). Edit expense (6 fields) is fully labelled; the `Field.tsx` component is correct but used in only 2 files (B-03).
- Instructions and validation associated with inputs: FAIL. `aria-invalid` appears in 1 source file (`app/ui/Field.tsx`); no dialog I opened has `[role=alert]` or `[aria-invalid]` pre-submission; sign-in error has no `role=alert` (B-12).
- Decorative icons hidden: PASS in sampled code (`Dialog.tsx` uses `aria-hidden` on icons); unnamed icon-only buttons are the issue, not decorative icons.
- Meaningful images: PASS (QR image has alt "QR Code untuk split bill ..." at `SplitBillViewer.tsx:539`).

### 6.3 Keyboard and focus
- Every feature operable by keyboard: PARTIAL. Verified in Journey H (below). Not verified: drag/chart interactions in `/compare` (not tested), camera upload.
- Focus order logical: PASS on dashboard (header, Saku switcher, cadence, banner, search, list, bottom nav last; see `B-tabstops-light.json`).
- Focus indicators visible: PASS. `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` (`globals.css:420`); measured computed outline `solid 2px rgb(232,89,12) offset 2px` on all 19 dashboard stops (headers, toggles, link, search, rows, nav, FAB). Ring colour vs page background 3.39:1 light, 7.22:1 dark; vs white card 5.87:1.
- Focus not hidden behind fixed content: FAIL (B-02).
- Dialogs move focus on open: PARTIAL; 22 of 24 do (to container, first field or close button); AI sheet does not (B-01).
- Modal containment: PARTIAL (AI sheet fails).
- Focus returns on close: PASS except split QR/delete (cannot close) and AI sheet (focus never left).
- No keyboard traps: PASS (Tab always cycles; no trap found outside intended modals).
- Menus/tabs/composite widgets: PARTIAL. There is no `role=tablist`; the cadence toggles and the "Hari Ini/Minggu Ini" filter use `aria-pressed` buttons inside `role=group name="Periode"`, which is a valid pattern (APG Tabs N/A). Both groups share the accessible name "Periode" (minor). Search is a disclosure (`aria-expanded` toggles true on Enter; focus stays on button; the search input is labelled "Cari"; Escape does not collapse it, which is optional). Saku switcher: `aria-haspopup=dialog`, `aria-expanded` toggles, Escape closes and keeps focus on the trigger; no arrow-key navigation inside (not required for a dialog popup). "Rincian" disclosure toggles `aria-expanded`. The account menu is a modal dialog, not role=menu (acceptable).

### 6.3 Visual and sensory
- Normal text contrast: PARTIAL. Own scan of all visible text nodes: 0 failures on `/` (light/dark, orange/pink/blue/mono), `/savings`, login dialog. Failures: `/split/<id>` light 1 (2.94:1), `/compare` 2 light (1.86:1) and 2 dark (2.23:1), `/split/new` and edit light 1 (4.47:1) via axe (B-13).
- Non-text contrast: FAIL for input borders (B-09). Progress fill vs track 3.64:1 light, 6.27:1 dark (pass). Track vs card 1.39:1 / 1.30:1 (decorative track, fill carries the value: acceptable). Toggle pressed vs unpressed background 1.06:1 light / 1.11:1 dark (state also changes text colour and weight class; PARTIAL).
- Colour alone: PARTIAL. Picker selection is colour only (B-08).
- 200% zoom (640x400) and reflow (320x640): see B-10. No horizontal scroll at 640x400 on any of 15 routes.
- Reduced motion: PASS (CSS) with exception B-15.
- Flashing: PASS. Only a 2s `pulse` (streak icon) and the 200ms fade/240ms modal animations exist; none flash more than 3 times per second.

### 6.3 Forms and status
- Required fields identified: PARTIAL. Native `required` present (3 on subscription add, 2 on goal create) but no visible asterisk or "wajib" text and no `aria-required`; screen readers announce native required. Visual indication absent.
- Errors in text: PARTIAL. Sign-in shows English "Invalid login credentials" (B-12). Savings failures use `role=alert` (`SavingsClient.tsx:591`). Dashboard error toast `role=alert` (`DashboardClient.tsx:668`). Subscriptions and split use native `alert()`/`confirm()` (19 occurrences in `app/`).
- Invalid fields identifiable: FAIL (no `aria-invalid` outside `Field.tsx`).
- Save success announced: PARTIAL. Dashboard has a permanent `aria-live="polite"` toast container (`DashboardClient.tsx:654`); Savings/Subscriptions/Split success feedback was not found to have a live region (button label swaps such as "Salin Link" to "Tersalin" are not announced). Verified in code only.
- Timeout/session expiry: UNVERIFIED (not tested).
- Authentication keyboard usable: PASS for keyboard operation; PARTIAL for recovery (no forgot password; B-12).

### 6.3 Target size
- SC 2.5.8: PASS. Across all routes and dialogs, 0 undersized (<24px) targets fail the spacing exception (script output `fail spacing exc 0` on every line).
- 44x44 internal target: PARTIAL. Rendered size: `/` 0 under 44, `/savings` 0, `/saku` 0, `/saku/<id>` 0; `/subscriptions` 14 under 44 (eff 4), `/split/new` 39 under 44 (eff 17), `/split/<id>/edit` 65 under 44 (eff 26). See B-16.
- Phase-2 "invisible hit area" claim: VERIFIED. `app/globals.css` (last block, `@layer base { @media (pointer: coarse) { ... ::after { min-width:44px; min-height:44px } } }`) applies to button, a[href], summary, [role=button|switch|tab]. Under `hasTouch+isMobile` `matchMedia("(pointer: coarse)")` is true and the `elementFromPoint` probe found e.g. login close 24x24 renders as 44x44 effective, bottom-nav and header unchanged. It does NOT cover input, select, textarea, checkbox: checkboxes are 13x13 to 20x20 with effective 14 to 20. On a desktop (fine pointer) there is no hit-area padding, so rendered sizes apply. Caveat: Playwright clicks are mouse-style clicks, so effective size is measured, not physically tapped.

### 6.4 Dialogs and buttons (accessibility aspects)
- Dialog semantics + name: PASS for all 24 dialogs, but the account menu is named "Buka menu" ("Open menu"), which is the opener's label rather than a title.
- Initial focus: PASS (container, first field or close) except AI sheet.
- Focus containment: PASS except AI sheet.
- Escape: PASS except QR and delete-confirm (B-05).
- Close button visible and named: FAIL for 8 dialog families (B-04).
- Background interaction disabled: PASS functionally (body overflow hidden, backdrop click closes). No `inert`/`aria-hidden` is applied to the page behind, so containment relies on `aria-modal` plus JS Tab handling. Design observation.
- Long content on short screens: PASS. At 320x640 and 640x400 add-standard, menu and sub-add dialogs scroll internally (`overflow-y:auto`, e.g. scrollH 789 in clientH 588) and the close button stays reachable.
- Destructive confirmation: PARTIAL. Native `confirm()` for subscription delete, goal delete, Saku archive (these dismiss correctly, accessible by default); custom modal for split delete (Escape broken).
- Selected/pressed states: PARTIAL (B-08).
- Labels remain after entry: PARTIAL; fields named only by placeholder keep their name in the accessibility tree but lose the visible label (B-03).

### Journey H: keyboard and assistive technology
1. Keyboard-only main workflow: PASS (verified live, `agent-B-journeyH.mjs`). From `/`: Tab reaches streak, AI, menu, Saku switcher, Mingguan/Bulanan, banner link, search, export, list filter, rows, Rincian, bottom nav, Add. Space on "Bulanan" sets `aria-pressed=true` and unsets "Mingguan". Menu then Enter on "Langganan" and "Arsip" navigates (dialog closes, url changes). Bottom nav links each navigate and the active link has `aria-current="page"`.
2. Dialog open/close: PASS except items in B-01, B-05.
3. Focus order and visibility: PASS for order and indicator; FAIL for obscured focus (B-02).
4. Forms and validation: FAIL (B-03, B-12).
5. Screen reader: UNVERIFIED (none available). Supporting evidence: `B-aria-dashboard.txt` and `B-aria-dialogs.txt` (ariaSnapshot). Dashboard tree has `main` > h1, groups "Periode" with `[pressed]`, region "Sisa hari ini" with `progressbar "Rp 195.500 dari Rp 500.000 minggu ini"`, list with row buttons named "Ubah <name>"; `navigation "Navigasi utama"` with links. Add dialog tree: dialog "Tambah pengeluaran", buttons "Ketik Cepat/Standar/Upload Foto" (no selected state), category and Saku buttons (no pressed state), `textbox "Ketik: cth. Makan 25k..."`, `checkbox` (no name), submit disabled until input.
Pass condition ("important tasks can be completed without a pointer"): PARTIAL, because focus hides under the fixed bar and the AI sheet is not keyboard-contained.

## 5. Findings

### [B-01] AI assistant sheet has no focus management or focus containment
- Status: FAIL
- Priority: P1
- Category: Accessibility
- Confidence: Verified live + Verified in code
- Route: any page with the header AI button, e.g. `/` · Viewport: 375x812 · Theme: light and dark · Auth state: typical
- Expected: WCAG 2.4.3 Focus Order, 2.1.2 (no trap, but modal must contain), APG Dialog (Modal): move focus into the dialog on open; Tab/Shift+Tab stay inside; focus returns on close.
- Actual: `role="dialog" aria-modal="true"` is set but the sheet is a plain div (`app/ai/AiAssistantSheet.tsx:277-281`) with only a window-level Escape listener (`:117-124`) and no focus code. After keyboard Enter on the invoker, `document.activeElement` stays on the "Asisten Keuangan AI" button behind the overlay (`inDialog:false`). 30 Tab presses: 21 end up outside the dialog (first leaks: "Buka menu", "Semua Saku"); Shift+Tab: 21 of 30.
- Repro steps: 1. Sign in as typical. 2. Tab to "Asisten Keuangan AI", press Enter. 3. Observe focus is still on the header button. 4. Press Tab repeatedly: focus goes to the dashboard behind the sheet.
- User impact: a keyboard or screen-reader user opens the assistant and must Tab through the entire hidden page before reaching the textarea; they can also activate hidden controls under the overlay.
- Evidence: `B-dialogs-light.json` entry `ai-sheet` (`initial.inDialog:false`, `tabFwdLeaks:21`, `tabBackLeaks:21`), `shots/B/dlg-ai-sheet-light.png`; source above. Escape works.
- Acceptance criteria:
  - [ ] Focus moves to the sheet (textarea or close) on open.
  - [ ] Tab x30 and Shift+Tab x30 never leave the sheet.
  - [ ] Focus returns to the AI button on close.

### [B-02] Focused elements are completely hidden behind the fixed bottom nav / Add button (WCAG 2.4.11)
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live
- Route: `/` (week and month lists), `/archive` (Buka semua), `/savings` · Viewport: 375x812 · Theme: light · Auth state: typical
- Expected: WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum): the focused component is not entirely hidden by author-created content; fix usually via `scroll-padding-bottom`.
- Actual: no `scroll-padding` anywhere in `app/` (grep). When Tab focuses a list row near the bottom, the browser only scrolls it to the viewport edge, under the fixed nav. Probe results (three points per element; `000` = fully covered): `/` weekly list "Ubah [A002] Kopi susu" top 756 to 812, nav top 755, samples `000`; monthly "Ubah [A002] Nasi padang" `000`; archive "Ubah [A002] Laundry" and "Gojek ke kampus" `000`; `elementFromPoint` returns the Add FAB (`BUTTON.-mt-5 ... h-14 w-14`). Screenshot shows the orange focus ring cut off at the nav top.
- Repro steps: 1. `/`, press Minggu Ini. 2. Tab through list rows. 3. The 3rd row appears under the nav with no visible focus.
- User impact: keyboard users cannot see which row is focused and may press Enter on an invisible edit target.
- Evidence: `agent-B-kb2.mjs` output (lists every stop whose rect intersects the nav), `shots/B/wcag-2411-obscured-focus.png`, `shots/B/kb2-*.png`.
- Acceptance criteria:
  - [ ] Add `scroll-padding-bottom` of at least the nav height (about 7rem including FAB) on the scroll container.
  - [ ] Re-run `agent-B-kb2.mjs`: no stop reports `visibleSamples:000`.

### [B-03] Many form controls have no programmatic label
- Status: FAIL
- Priority: P1
- Category: Accessibility
- Confidence: Verified live
- Route: `/split/new`, `/split/<id>/edit` (page), and dialogs: add (checkbox), goal create/edit/allocate/withdraw/move/balance, Saku create/edit/transfer/income, subscription add/edit, notifications · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: WCAG 1.3.1, 3.3.2, 4.1.2: each field has a programmatically associated label (`for`/`id`, wrapping label or `aria-label`).
- Actual: axe critical `label` and `select-name` on `/split/new` (label 1, select-name 2), `/split/<id>/edit` (label 1), Saku transfer (select-name 2, label 1), Saku income (select-name 1, label 1), subscription add and edit (label 2, select-name 3), goal allocate/withdraw/move (label 1), notifications (label 4: a time input and 3 checkboxes), add-quick "Tetap buka" checkbox (label 1). DOM count: subscription add has 7 `<label>` elements and none is linked (no `for`, not wrapping); goal create 3 of 3 unlinked; add-standard has no `<label>` at all, so "0" (amount) and "Nama pengeluaran" are named only by placeholder; amount fields in goal/balance dialogs named only by placeholder ("cth. 1.000.000"). Source: `<label>` 59 vs `htmlFor` 6 in `app/`; `app/ui/Field.tsx` (correct, `useId` + `htmlFor` + `aria-describedby` + `aria-invalid`) is used only by `ExpenseList.tsx` and `EmailSyncSettingsModal.tsx`.
- Repro steps: 1. Open any dialog above. 2. Run axe or inspect the accessibility tree: the controls expose no name.
- User impact: screen-reader users hear "edit text" or "combo box" with no purpose for core forms such as subscriptions and splits.
- Evidence: `B-axe-routes.json`, `B-dialogs-light.json`, `B-aria-dialogs.txt`, `agent-B-req.mjs` output (`labelsNotFor:7 labelsTotal:7`).
- Acceptance criteria:
  - [ ] axe `label` and `select-name` report 0 on every route and dialog above.
  - [ ] Fields named only by placeholder gain a real label (visible or `aria-label`).

### [B-04] Icon-only buttons without accessible names (close X, pickers, row actions)
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live
- Route: dialogs: streak, goal create/edit/allocate/withdraw/move/balance, Saku create/edit/transfer/income, subscription edit; page `/subscriptions` · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: WCAG 4.1.2, 2.4.6; WCAG 1.1.1 for icon content.
- Actual: axe critical `button-name`: streak close (24x24), savings dialogs close (16x16), Saku dialogs close (36x36) plus 10 unnamed emoji/colour buttons in Saku create/edit (`SakuFormModal.tsx:230,253`), subscription edit 12x12 button. Subscription row actions "Jeda Langganan", "Edit", "Hapus" are named only by `title` (no `aria-label`), 26x26. 
- Repro steps: 1. Open "Tambah Target Baru" on `/savings`. 2. Inspect the close button (16x16 X): no name.
- User impact: screen-reader users cannot find the close control; Escape works, so there is a workaround. The 10 emoji pickers are indistinguishable.
- Evidence: `B-dialogs-light.json` (`buttonsNoName`, `closeBtns`), `/subscriptions` `outerHTML` dump (`title="Edit"` only).
- Acceptance criteria:
  - [ ] axe `button-name` 0 for all listed dialogs.
  - [ ] Pickers expose name and `aria-pressed`.

### [B-05] Escape does nothing in the split QR dialog and the split delete confirmation
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live + Verified in code
- Route: `/split/49b6b834-...` · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: APG Dialog (Modal): Escape closes the dialog; focus returns to the invoker.
- Actual: `SplitBillViewer.tsx:107-118` registers a window Escape listener, but both modals use `ModalOverlay`, whose handler calls `e.stopPropagation()` (`app/ui/ModalOverlay.tsx:46-48`) then `close()`, which only finds a close button containing `svg.lucide-x` (`:51-61`) or falls back to a missing `onMouseDown`. These two dialogs have text buttons ("Tutup", "Batal"), so nothing happens. Test: Escape pressed, `afterEsc.n:1` in both themes; focus stays inside.
- Repro steps: 1. Tab to "Kode QR", Enter. 2. Press Escape: dialog remains. Same for "Hapus".
- User impact: keyboard users must Tab to the visible button to leave; focus is not returned to the invoker on the visible-button route either (unverified).
- Evidence: `B-dialogs-light.json` `split-qr`, `B-dialogs2-light.json` `split-delete-confirm`.
- Acceptance criteria:
  - [ ] Escape closes both dialogs and focus returns to "Kode QR" / "Hapus".
  - [ ] `ModalOverlay` falls back to a configured `onClose`.

### [B-06] `/saku`, `/saku/<id>` and `/subscriptions` have no `<main>` landmark
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live
- Route: those three · Viewport: 375x812 · Theme: both · Auth state: typical and empty
- Expected: WCAG 1.3.1, 2.4.1; ARIA landmarks (one `main`).
- Actual: axe `landmark-one-main` (1) and `region` (12, 24, 10 on typical; 3 on empty) on all three; ariaSnapshot/landmark list shows only `header` and `nav`. `/saku/<id>` also has 22 h3 and no h2 grouping.
- Repro steps: 1. Open `/subscriptions`. 2. `document.querySelector('main')` returns null.
- User impact: screen-reader users cannot jump to main content; no skip link exists either.
- Evidence: `B-axe-routes.json` (`meta.landmarks`).
- Acceptance criteria:
  - [ ] Each route has exactly one `<main>` containing the page content; axe `landmark-one-main` and `region` 0.

### [B-07] Page titles are not unique per route
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live
- Route: all except `/subscriptions` · Viewport: n/a · Theme: n/a · Auth state: all
- Expected: WCAG 2.4.2 Page Titled (descriptive); orientation after navigation.
- Actual: `/`, `/savings`, `/saku`, `/saku/<id>`, `/split`, `/split/new`, `/split/<id>`, `/split/<id>/edit`, `/compare`, `/archive`, `/does-not-exist` all have title "SakuTrack : Student Budget Tracker". Only `/subscriptions` has "Langganan Digital : SakuTrack" (`app/subscriptions/page.tsx:10`). After keyboard navigation focus lands on `body` and the document title does not change, so no cue other than the route announcer (not tested with an AT).
- Repro steps: 1. Visit routes. 2. Read `document.title`.
- User impact: tabs and history entries are indistinguishable; screen-reader users get no page-change cue.
- Evidence: `B-axe-routes.json` (`meta.title`).
- Acceptance criteria:
  - [ ] Each route exports distinct metadata (for example "Tabungan : SakuTrack").

### [B-08] Selected state of pickers and mode tabs is conveyed by colour only
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live + Verified in code
- Route: Add expense dialog (modes Ketik Cepat/Standar/Upload Foto, Saku, category), Saku switcher items, subscription filters · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: WCAG 1.4.1, 4.1.2; APG Tabs or toggle-button patterns.
- Actual: 0 `aria-pressed|selected|checked|current` in the add dialog; `grep -c aria-pressed` = 0 in `QuickAddExpense.tsx`, `SakuSwitcher.tsx`, `SubscriptionsClient.tsx`, `SavingsClient.tsx`. (The dashboard cadence toggles do expose `aria-pressed`, so the pattern exists.) The mode buttons are plain buttons, not `role=tab`.
- Repro steps: 1. Open add dialog. 2. `ariaSnapshot()` shows buttons with no `[pressed]`.
- User impact: screen-reader users cannot tell which mode, category or Saku is selected before saving.
- Evidence: `B-aria-dialogs.txt`, `agent-B-nontext.mjs` output `selected-state attrs ... pressed:0 selected:0`.
- Acceptance criteria:
  - [ ] Selected options expose `aria-pressed` or `role=tab/aria-selected` consistently.

### [B-09] Input and control borders fail non-text contrast (1.4.11)
- Status: FAIL
- Priority: P2
- Category: Accessibility
- Confidence: Verified live (computed)
- Route: `/` search button, Add dialog name input · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: WCAG 1.4.11: a visual boundary needed to identify a control has at least 3:1 against adjacent colours.
- Actual: name input border vs surrounding card 1.27:1 light, 1.18:1 dark (input fill vs card 1.02:1 / 1.12:1); search button border 1.31:1 / 1.44:1; the amount field has no border (fill equals surroundings, "Rp" prefix gives context). Pressed vs unpressed cadence toggle fills 1.06:1 / 1.11:1 (partly mitigated by text colour change). Focus ring passes (3.39:1 light vs page, 5.87:1 vs card).
- Repro steps: run `agent-B-nontext.mjs`.
- User impact: low-vision users may not see where fields start and end.
- Evidence: script output lines `name input ... borderVsParent:1.27`.
- Acceptance criteria:
  - [ ] Field borders or fills reach 3:1 against the surface in light and dark.

### [B-10] Horizontal scroll at 320px (reflow) on three routes
- Status: FAIL
- Priority: P2
- Category: Accessibility / Responsive
- Confidence: Verified live
- Route: `/subscriptions` (scrollWidth 347), `/split/new` (344), `/split/<id>/edit` (390) · Viewport: 320x640 · Theme: light · Auth state: typical
- Expected: WCAG 1.4.10 Reflow: no two-dimensional scrolling at 320 CSS px.
- Actual: overflowing nodes: subscriptions row action group ("Bayar Split Bill" and "Hapus", right edge 338); split new/edit "Tambah" button and "Rp" price input (right 343 to 344); split edit item remove button right edge 384. Other routes: scrollWidth 320. With a dialog open the layout viewport widens (sub-add dialog 347px). 640x400: no overflow on any of 15 routes.
- Repro steps: 1. 320x640 viewport. 2. Open `/subscriptions` as typical.
- User impact: low-vision users zooming to 400% have to pan sideways on those screens, including the dialog that adds a subscription.
- Evidence: `B-reflow.log`, `shots/B/reflow320-subscriptions.png`, `reflow320-split-new.png`, `reflow320-split-edit.png`.
- Acceptance criteria:
  - [ ] `document.scrollingElement.scrollWidth <= 320` on these routes and their dialogs.

### [B-11] Text-spacing override increases truncation and one overflow (1.4.12)
- Status: PARTIAL
- Priority: P3
- Category: Accessibility
- Confidence: Verified live
- Route: `/`, `/savings`, add dialog, `/subscriptions` · Viewport: 375x812 · Theme: light · Auth state: typical
- Expected: WCAG 1.4.12: no loss of content or function when spacing is raised.
- Actual: with the CSS override, single-line `text-overflow: ellipsis` clipping grows (dashboard 1 to 6 clipped nodes, savings 3 to 6, subscriptions 0 to 4: h1 "Jumat, 13 Nov", "1 langganan segera jatuh tempo", "[A002] Gojek ke kampus", "Kategori Teratas" values). Subscriptions page also gains horizontal overflow (scrollWidth 379). No text is hidden inside fixed-height boxes. Some truncation exists even without the override (6 nodes at 320px).
- Repro steps: inject `*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}`.
- User impact: users who set larger spacing lose parts of names and dates behind ellipses.
- Evidence: `B-reflow.log` lines `textSpacing`, `shots/B/textspacing-*.png`.
- Acceptance criteria:
  - [ ] Key values (title, amounts, names) wrap instead of truncating, or are available in full by another means.

### [B-12] Authentication: errors not announced or associated; no forgot-password; no show-password
- Status: FAIL
- Priority: P2
- Category: Accessibility / UX
- Confidence: Verified live
- Route: `/?auth=login` · Viewport: 375x812 · Theme: light · Auth state: signed-out
- Expected: WCAG 3.3.1 Error Identification, 4.1.3 Status Messages, 3.3.8 Accessible Authentication (min.); APG: `role=alert`/`aria-describedby` and `aria-invalid`.
- Actual: invalid email: the browser's native validation bubble blocks submit (message "Please include an '@' ..." in the browser's language, not the app's), no `aria-invalid`. Wrong credentials for the non-existent test account: the dialog shows `<p>` "Invalid login credentials" (English, raw Supabase text) with no `role`, no `aria-live`, no `aria-describedby`/`aria-invalid` on the inputs; focus stayed on the password input. No "forgot password" text or link anywhere; no show-password toggle (`forgot:false, showPw:false`). Mode switch ("Buat Akun"/"Masuk") buttons are plain buttons with no pressed/selected state and are 28px high (eff 44).
- Repro steps: 1. Open `/?auth=login`. 2. Enter `audit002-nobody@sakutrack.test` and any wrong password. 3. Press Enter. 4. Inspect the error element.
- User impact: screen-reader users are not told that sign-in failed; users who forget the password have no recovery path in-app.
- Evidence: `agent-B-auth.mjs` output (`error markup`, `forgot/show-password present`), `shots/B/auth-3-error.png`.
- Acceptance criteria:
  - [ ] Error container `role=alert` (or inputs `aria-invalid` + `aria-describedby`); message localised.
  - [ ] A password-recovery path exists.

### [B-13] Remaining text-contrast failures
- Status: FAIL
- Priority: P3 (compare, split-new); P2 for the friend view because it is the public page
- Category: Accessibility
- Confidence: Verified live + Verified in code
- Route: `/split/<id>` (signed in and signed-out friend view), `/split/new`, `/split/<id>/edit`, `/compare` · Viewport: 375x812 · Theme: light (and dark for `/compare`) · Auth state: all
- Expected: WCAG 1.4.3: 4.5:1 for normal text.
- Actual: payment card account-holder line, `text-zinc-400` on `bg-zinc-800/90` (`app/split/[id]/SplitBillViewer.tsx:328-333`): 2.93:1 (axe: #7f6e57 on #32281d, 12px) and 2.94:1 (own scan), light only; also the same node triggers contrast in the QR and delete dialogs behind. `/split/new` and edit: `opacity-75` text 4.47:1 (#537963 on #edf7f0, 12px). `/compare` future-day labels "Sab", "Min": 1.85:1 light, 2.23:1 dark at `opacity-40` (axe 2 nodes each theme). Dashboard, savings, login dialog, palettes pink/blue/mono on `/`: 0 failures in my scan.
- Repro steps: light mode, open split `<id>` signed out.
- User impact: friends reading the bank holder name see low-contrast text.
- Evidence: `B-axe-routes.json`, `B-contrast.json`.
- Acceptance criteria:
  - [ ] All listed nodes reach 4.5:1; axe `color-contrast` 0 on these routes.

### [B-14] Heading order skips and long flat h3 lists
- Status: PARTIAL
- Priority: P3
- Category: Accessibility
- Confidence: Verified live
- Route: `/split`, `/compare`, `/saku/<id>`; streak and notification dialogs · Viewport: 375x812 · Theme: both · Auth state: typical
- Expected: WCAG 1.3.1 (heading structure), best practice.
- Actual: axe `heading-order` on `/split` (h1 then h3), `/compare` (h1, h3), streak and notifications dialogs (dialog heading h3/h2 without parent) and `/?auth=login` (h3, no h1). `/saku/<id>`: h1, h2, then 22 h3. Not a blocker.
- Evidence: `B-axe-routes.json` (`meta.h`).
- Acceptance criteria:
  - [ ] No skipped heading levels; dialogs headings use consistent level.

### [B-15] Confetti in the split viewer ignores reduced motion
- Status: FAIL
- Priority: P3
- Category: Accessibility
- Confidence: Verified in code
- Route: `/split/<id>` when all participants paid · Viewport: any · Theme: any · Auth state: any
- Expected: WCAG 2.3.3 (AAA) and the product's own reduced-motion intent; CSS rule at `globals.css:491` covers CSS animation only.
- Actual: `SplitBillViewer.tsx:99-103` calls `confetti({...})` without `disableForReducedMotion`; `SavingsClient.tsx:127` does pass `disableForReducedMotion: true`. CSS animations are correct: with `reducedMotion: reduce` the fade, modal and pulse animations compute to 0.01ms/1 iteration (`B` motion script: `fadeIn 1e-05s`, streak pulse removed).
- Evidence: source above; `agent-B-motion.mjs` output.
- Acceptance criteria:
  - [ ] `disableForReducedMotion: true` added to the split viewer's confetti call.

### [B-16] Targets under 44px remain on forms and the split editor
- Status: PARTIAL
- Priority: P3
- Category: Accessibility
- Confidence: Verified live
- Route: `/split/new`, `/split/<id>/edit`, `/subscriptions`, Saku create, add dialog · Viewport: 375x812 coarse pointer · Theme: light · Auth state: typical
- Expected: internal 44x44 target; WCAG 2.5.8 (24px or spacing exception).
- Actual: 2.5.8 passes everywhere (0 spacing-exception failures). Effective hit area (after `::after` padding) under 44 in either axis: `/subscriptions` 4 (Jeda/Edit 30x44), `/split` 1, `/split/new` 17 of 47 (checkboxes 14x14, quantity field 30x40, bank chips ~44x28 render), `/split/<id>/edit` 26 of 74 (checkboxes 14x14 to 14x16, "Hapus [A002] Rina" 8x16 renders 44x44 effective), `/archive` 1 (search input 344x40), add dialog 11 (checkbox 16x16), edit expense checkbox 20x20 (effective 20x20), Saku create 20 (picker buttons 36x36 to 36x44), AI 6 (32 to 38). Inputs, selects, textareas and checkboxes are not covered by the `::after` hit-area rule. The dashboard, savings, Saku hub and main dialogs are fully at or above 44.
- Evidence: `B-targets.json`, per-route lines in `agent-B-targets.mjs` output.
- Acceptance criteria:
  - [ ] Checkboxes and radio inputs have a 44px effective hit area via wrapping label.

### [B-17] Typed text is silently discarded when the add dialog is closed with Escape
- Status: PARTIAL
- Priority: P3
- Category: UX / Accessibility
- Confidence: Verified live
- Route: `/` Add dialog · Viewport: 375x812 · Theme: light · Auth state: typical
- Expected: plan 6.4: data not silently discarded when a form is cancelled; WCAG 3.3.4 (AA applies to legal/financial submissions only, so this is a usability note).
- Actual: typed "Makan 25k" (preview "Terdeteksi" shown), pressed Escape: dialog closed with no prompt; reopening shows an empty field.
- Evidence: `agent-B-journeyH.mjs` output ("Escape with typed text -> dialogs: 0", "reopen field value: \"\"").
- Acceptance criteria:
  - [ ] Draft kept across close, or a close confirmation when the field is dirty.

### [B-18] (Not a defect) Lead's login observation not reproduced
- Status: N/A
- Priority: n/a
- Category: Accessibility
- Confidence: Verified live
- Route: `/?auth=login` · Viewport: 375x812 · Theme: light · Auth state: signed-out
- Actual: in both modes the inputs have associated labels: Masuk: `textbox "Email"` and `textbox "Kata Sandi"` (`label:Email`, `label:Kata Sandi` via `input.labels`, plus `autocomplete=email|current-password`); Buat Akun: same plus `autocomplete=new-password`. Placeholders are exposed as `/placeholder` only, not the name. Submit buttons are named "Masuk" and "Simpan Akun" (`type=submit`, text visible). Dialog `aria-labelledby` resolves to "Selamat Datang Kembali" (Masuk) and "Amankan Data Pengeluaran Anda" (Buat Akun). axe: 0 violations in both modes. The earlier observation may have come from an older build or a view that differs from production; I cannot say.
- Evidence: `agent-B-auth.mjs` output, `B-aria-dialogs.txt` (LOGIN tree).

## 6. Audit 001 cross-check (items in scope)

| # | Audit 001 item | Status | Evidence |
|---|---|---|---|
| 1 | 19 of 21 overlays not real dialogs (Escape, role, focus) | FIXED for 22 of 24 dialogs; STILL PRESENT for AI sheet (focus) and Split QR/delete (Escape) | section 3 matrix; B-01, B-05 |
| 2 | Labels not connected to fields | PARTIAL: login, edit expense, search, budget fixed; STILL PRESENT in many dialogs and split forms | `<label>` 59 vs `htmlFor` 6; B-03 |
| 3 | Pinch zoom blocked | FIXED | viewport meta is `width=device-width, initial-scale=1`; `layout.tsx` has no `maximumScale` |
| 4 | No reduced-motion handling | FIXED for CSS and savings confetti; split viewer confetti STILL PRESENT | `globals.css:491`, motion script, B-15 |
| 5 | Tap targets under 44px | FIXED for nav, Add, auth, toggles, close buttons (rendered or effective 44); STILL PRESENT for checkboxes, inputs and some split/subscription controls | `B-targets.json`; B-16 |
| 6 | Contrast failures | PARTIAL: dashboard, savings and login clean; 5 node groups remain | B-13 |
| 10 | Dead and hover-only controls | PARTIAL: savings history delete no longer `opacity-0` (no match in `SavingsBalanceHistory.tsx`); Saku emoji button now has `onClick` (`SakuFormModal.tsx:230`) but is unnamed; unverified whether `SplitBillViewer` clickable div (old `:341`) still exists (line moved; the matching code is now a native button) | B-04 |
| 23 | Text under 12px | FIXED | 0 text nodes under 12px on 6 routes; grep `text-[11px]|[10px]|[9px]|[8px]` = 0 matches in `app/` |
| 34 | No forgot-password link, no show-password toggle, English auth errors | STILL PRESENT | B-12 |
| 35 | Bottom nav and Add visible behind welcome modal when signed out | FIXED: signed-out landing shows only 2 targets, no bottom nav | `B-targets.json` `out /` total=2 |
| 9 | Native `alert()`/`confirm()` 21 uses | STILL PRESENT (19 now) | `grep -rn "alert(\|confirm(" app` = 19 |

## 7. Strengths observed
- One shared `Dialog` (`app/ui/Dialog.tsx`): role, aria-modal, aria-labelledby, Escape, backdrop with busy guard, focus restore, Tab wrap, body scroll lock, 44px named close button. `ModalOverlay` retrofits the older modals (labelled by first heading, Escape, Tab wrap, restore).
- `app/ui/Field.tsx` is a correct label/hint/error pattern (`htmlFor`, `aria-describedby`, `aria-invalid`, `role=alert`).
- Focus ring is consistent and strong: 2px accent outline, 2px offset, all 19 dashboard stops, 3.39 to 8.25:1 against surfaces.
- Dashboard semantics: single h1, `main`, `nav[aria-label]` with `aria-current`, `group "Periode"` with `aria-pressed`, `progressbar` with a name, disclosures with `aria-expanded`, row buttons named "Ubah <name>".
- Dashboard, savings, archive: 0 axe violations in light and dark; own contrast scan: 0 failures on `/` in 4 palettes x 2 themes.
- `::after` coarse-pointer hit-area rule works (e.g. login close 24px renders 44x44 effective).
- Reduced motion handled in CSS; savings confetti honours it; no flashing content.
- Pinch zoom allowed; no text under 12px; 640x400 (200% equivalent) has no horizontal scroll on any route; dialogs scroll internally on short screens.
- A permanent `aria-live="polite"` toast region and `role=alert` errors exist on the dashboard and savings.
- Login labels and button names are correct (B-18).

## 8. Not tested / limitations
- Screen readers: UNVERIFIED (none available); accessibility trees come from Playwright `ariaSnapshot()`.
- The brief's `aria-invalid` on-blur validation for dialogs was not exercised: I did not submit any form (client-side blocking could not be confirmed safe), so field error association inside dialogs is evaluated by code and DOM only.
- Session-expiry behaviour, forced-colors/high-contrast mode, Windows magnification and real 400% browser zoom were not tested; reflow used 320x640 CSS px as the equivalent.
- `/compare` chart keyboard interaction, camera/photo upload flow, QR scanning, push notification settings behaviour were not exercised beyond opening.
- Roles `empty` and `large`: only axe and titles for `empty`; `large` not run; 320px and target size for `empty` not run.
- AI sheet content was not interacted with (no messages sent).
- The first dialogs pass had timeouts on a few items (load from parallel runs); re-run results used. `savings-delete-goal`, `sub-delete`, `saku-archive` open native `confirm()`; their keyboard behaviour is browser-controlled and not scored.
- Design observations (not defects): no `inert` on the page behind modal dialogs (relies on `aria-modal` and JS Tab wrap); the account menu dialog is named "Buka menu"; the weekly budget in the menu shows "Rp 500.000" (sum of Saku budgets), same figure as the dashboard "dari Rp 500.000 minggu ini", while the primary Saku is 350.000 (a UX clarity point for Agent A/C, not an a11y finding).
