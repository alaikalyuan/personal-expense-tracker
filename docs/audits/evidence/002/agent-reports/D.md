# Agent D report - Critical user journeys, usability and data integrity (Audit 002)

Run: 2026-11-13 ~02:00-03:10 +0700. Playwright 1.65 headless Chromium, 375x812, light theme, prod server http://localhost:3100. Scripts: `SCRATCH/tools/agent-D-*.mjs` (run with `node` from SCRATCH/tools). Screenshots: `SCRATCH/out/shots/D/`. Receipt used: `SCRATCH/agents/D/receipt-A002.png`; CSV export: `SCRATCH/agents/D/export-week.csv`.

## 1. Summary
- Audit 001 first-visit problems (#24 hidden risk copy, #25 backdrop creates guest, #35 nav behind modal) are FIXED. No stray interaction created a guest.
- Core money flows work and reconcile: Quick Add, edit, delete, budget arithmetic (weekly, monthly, Saku, over-budget), duplicate submission protection (1 row in every double/slow click test), retry after failure never duplicated.
- Compare headline is now normalised (#27 FIXED).
- Worst open defects: savings goal field silently saves dotted amounts as Rp 2 (D-01); savings withdrawal can overdraw to -Rp 999.779.999 (D-02); removing a split participant silently re-spreads their sole item (D-03); split item qty/price inputs unreadable at 375px (D-12); unset budget shown as Rp 500.000 incl. in exports (D-04); export daily average hardcoded /7 (D-05).
- Failures show a red banner/toast, but always raw English "Failed to fetch" (D-10). Push test UNVERIFIED (headless push registration denied).
- Records created: see section 8 (guest created 2026-11-13 02:05:15 +0700).

## 2. What I ran
All scripts `SCRATCH/tools/agent-D-*.mjs` (a1-a7 guest/first visit, b0-b13 record expense/photo, c1-c5 find older, d1-d9 budget/compare/export, e1-e14 split, f1-f6 subscription, s1-s9 savings, k1-k8 Saku, g1-g4 failure, ai1-ai2, em1-em5 email, n1-n2 push, au1 auth, dup2 duplicate, p1 persistence). Auth: guest (self-created) and `journey` via lib `login`/saved storage state (state files deleted at the end). Viewport 375x812, light theme. Failure injection: `page.route` aborting POST with `next-action` header, `ctx.setOffline(true)`, delayed route (2.5s) for duplicate test. AI: 2 live prompts + 1 aborted (no cost) (journey counter read 5/20 on open, 7/20 at end; the 5 pre-existing uses are not mine). Photo AI: 1 upload. Email: 1 paste-parse. Push: 0 test sends (see G).

## 3. Journey table
| Journey | Steps passed | Result | Evidence |
|---|---|---|---|
| A First-time visitor | initial screen, risk copy visible, 5 stray interactions (click corner/edge/risk card, dblclick, Escape, wheel) + dialog Escape/Tutup/Batal/backdrop: 0 auth cookies; no nav for signed-out; guest created once via button; guest expense; Mode Tamu -> upgrade dialog; guest cannot sign out | PARTIAL (all checks pass; no guest sign-out, nav "Patungan" bounces) | A01-A14 shots |
| B Record expense | Quick Add 3 phrases + preview==saved; 1 POST on dblclick/3xEnter/slow server; budget math; standard form; invalid amounts; edit all fields persist; delete w/ confirm; photo; reload+re-login persistence | PARTIAL (D-08, D-09, D-11; photo "Terapkan" step UNVERIFIED: single upload spent on extraction) | B02-B17 |
| C Find older expense | search week/month, reset, archive search for 20 Oct | PARTIAL (works; scope unstated; prior month only via Archive) | C03-C10 |
| D Understand budget | weekly 300k, monthly 1.2M, over-budget, compare, export, CSV | PARTIAL (D-04, D-05, D-06, D-07) | D01-D13 |
| E Split a bill | items-then-friends, assign, add/remove participant, publish, friend view, QR, copy granted/denied, edit | PARTIAL (D-03, D-12, D-13) | E02-E15 |
| F Subscription | create w/ split, edit price only, reload, pause/resume, delete confirm | PASS for split/price/pause; notes UNVERIFIED live (no notes field, cannot seed), verified in code | F02-F07 |
| G Failure/recovery | expense, savings, goal, subscription aborted/offline; retry; /split RSC abort | PARTIAL (D-10; masquerade verified in code only) | G01-G06 |
| AI | 2 live prompts + error state | PARTIAL (D-18) | AI03-AI05 |
| Email paste-parse | 1 synthetic Livin' text -> queue -> Catat (dblclick = 1 row) | PASS | EM04-EM06 |
| Push | permission granted; enable fails | UNVERIFIED | N03 |
| Savings & Saku | goal, deposit, move, allocate, take back, withdraw, 2nd Saku, expense in it, totals | PARTIAL (D-01, D-02, D-17) | S03-S13, K03-K09 |

## 4. Key arithmetic (all from data I entered)
Week Mon 9-Sun 15 Nov, today Fri 13 = 3 days left incl. today.
- Fresh guest/journey, no budget: shown "Sisa hari ini Rp 166.667 / Aman Rp 500.000 untuk 3 hari lagi / Rp 0 dari Rp 500.000". 500.000/3 = 166.667. Budget never set (D-04).
- After lunch 15.000: 500.000-15.000 = 485.000 (shown); 166.667-15.000 = 151.667 (shown).
- After kopi 18.000, gojek 22.500 (yesterday), fotokopi 20.000 (yesterday): total 75.500; remaining 424.500; today allowance (500.000-42.500)/3 - 33.000 = 119.500 (shown). Avg/day 75.500/5 = 15.100 (shown).
- Weekly set 300.000, spend 63.500: remaining 236.500; (300.000-30.500)/3 - 33.000 = 56.833 (shown).
- Monthly (weekly 300k -> 300.000x30/7 = 1.285.714 shown): spend 138.500, remaining 1.147.214, (1.285.714-105.500)/18 - 33.000 = 32.567 (shown). Monthly set 1.200.000: (1.200.000-105.500)/18 - 33.000 = 27.806 (shown).
- Over budget (weekly 100k, spent 136k Dompet Utama): "lewat Rp 36.000" = 136.000-100.000. With 300k: today spent 105.500, allowance (300.000-30.500)/3 = 89.833, over by 15.667 (shown); tomorrow (300.000-136.000)/2 = 82.000 (shown).
- Semua Saku: budget 300.000+150.000 = 450.000; spent 101.500+25.000 = 126.500; remaining 323.500 (all shown). Saku Kos alone 25.000 of 150.000, 125.000 left (shown).
- Compare (last week Mon 30.000, Thu 45.000, Sun 40.000): to day 5 = 75.000, full week 115.000. This week 63.500. Headline "15% lebih hemat, -Rp 11.500": 75.000-63.500 = 11.500; 11.500/75.000 = 15.3%. Normalised, correct. Pace card: 63.500/5 = 12.700 vs 115.000/7 = 16.429 (shown) = mixed 5-day vs 7-day.
- Export weekly 63.500, target 300.000, sisa 236.500 correct; "Rata-rata Rp 9.071/hari" = 63.500/7, dashboard shows 12.700 (/5). Export monthly: total 178.500, avg shown 25.500 = 178.500/7 (dashboard basis 178.500/13 = 13.731). CSV rows 15.000+18.000+22.500+8.000 = 63.500 matches.
- Split typical bill 49b6b834: subtotal 87.000; Saya 25.000+8.000 = 33.000, Rina 32.000+8.000+3.000 = 43.000, Dimas 8.000+3.000 = 11.000. x1.15 (10% tax + 5% service on subtotal): 37.950 / 49.450 / 12.650, total 100.050 = 87.000x1.15. Friend view shows exactly those. PASS.
- My bill, same items, default rounding Rp 100: 37.950 -> 38.000; 49.450 -> 49.500; 12.650 -> 12.700; total 100.200 vs 87.000+8.700+4.350 = 100.050 (150 unexplained, D-13). Host 38.000 auto-logged as expense: 63.500+38.000 = 101.500 (shown).
- After removing Rina (sole on Ayam bakar 32.000; shared Kerupuk 6.000): host 53.000 = 25.000+12.000 (Es jeruk 24.000/2)+16.000 (half of Ayam bakar); Dimas 34.000 = 12.000+6.000+16.000; total 87.000 (D-03).
- Savings: deposit 150.000 -> pokok 150.000; move 100.000 of sisa anggaran to goal -> pokok 250.000 (free 150.000 + target 100.000), sisa 435.000-100.000 = 335.000; allocate 50.000 -> free 100.000/target 150.000; take back 20.000 -> 120.000/130.000; withdraw 30.000 -> pokok 220.000 (free 90.000 + target 130.000); Total Masuk 250.000, Keluar 30.000. All reconcile; /saku "Total Saldo" 220.000 equals.
- Subscription: 34.990/2 = 17.495; 35.990/2 = 17.995 (shown).
- AI answer 1: budget 450.000, used 142.500, sisa 307.500 = dashboard; "sisa 4 hari" -> 76.875/hari vs dashboard 3 days (307.500/3 = 102.500). Answer 2: today 112.000 = 15+18+38+25+9+7 (correct).

## 5. Checklists
### 6.2 Usability
- Know where you are: PASS (titles, nav highlight).
- Timely feedback: PARTIAL (rows update; "Tersimpan!" in keep-open; failures raw English D-10).
- Terminology: PARTIAL ("One-Off", "Ready", Alokasikan/Pindahkan/Aliran).
- Predictable nav: PARTIAL (Patungan in bottom nav but guests bounce; nav label becomes "Saku Saya" with Multi-Saku).
- Discoverable: PARTIAL (subscriptions/archive/notifications/email only in menu).
- Undo/cancel/edit: PARTIAL (edit + delete confirm; no undo, copy says "Tidak bisa dibatalkan"; cancel discards silently D-11).
- Destructive protected: PASS (inline "Ya, hapus"; native confirm for subscription/goal; savings history delete visible 44px). Overdraw NOT protected (D-02).
- Forms prevent invalid input: FAIL (D-01, D-02, D-08).
- Empty states: PASS (explain + CTA); archive search 0 results has no message ("0 minggu minggu cocok").
- Error messages: FAIL (raw "Failed to fetch", "Invalid login credentials").
- Loading != empty: UNVERIFIED live; code: split fetch error -> empty state.
- Important info without scrolling: PASS dashboard top; split form sticky total bar overlaps content.
- Efficient repeats: PASS (Enter to save, shortcuts, keep-open).
- Calculations not misleading: PARTIAL (D-04..D-07, D-15).
- Guest limits clear: PASS (welcome copy fully visible; Mode Tamu dialog); P3 note: copy says data is "only stored in the browser" but guest rows are saved via server actions (reload shows them), only access is cookie-bound.
### 6.4 Interaction (functional)
- Dialogs: Escape closes add/edit/savings/login (FIXED vs 001); QR dialog does NOT close on Escape (D-20); focus after closing login dialog goes to body; Tutup 24px (login/notification).
- Buttons: real actions PASS; repeated taps no duplicates PASS (quick, standard, subscription, savings, email Catat dblclick, slow-server); hover-only: none seen in savings history.
- Forms: auth labels connected PASS; expense amount text+numeric with grouping PASS; savings/goal/Saku/split money fields type=number FAIL (D-01); validation "Nominal harus lebih dari 0" shows at top and stays stale after fixing; native English tooltip for blank name; silent discard on cancel (D-11); success feedback PASS.
### 6.6 Reliability and data integrity
- Failed saves visible: PARTIAL (banner "Failed to fetch"; data kept).
- Persist after refresh/re-login: PASS (counts matched after fresh login: 161.000 week total, savings 225.000).
- Failed fetch != empty: FAIL in code (`app/split/page.tsx` logs error, renders empty list). Live UNVERIFIED (RSC abort falls back to full-page load and renders normally).
- Retry no duplicates: PASS (expense, savings, goal, subscription, email).
- Editing preserves hidden fields: PASS subscription split config (live); notes by code `app/subscriptions/SubscriptionsClient.tsx:181,228`.
- Delete deliberate/recoverable: PARTIAL (confirmed, not recoverable).
- Totals reconcile: PASS except D-05/D-13.
- Split reconciles: PARTIAL (D-03, D-13).
- Budget comparisons equivalent: PARTIAL (headline PASS; pace card D-06).
- Exports match: PARTIAL (CSV PASS; recap D-04/D-05; archive recap omits budget).
- Guest limits accurate: PARTIAL.
- Auth boundaries: PASS (signed-out deep links redirect to welcome with ?next; friend view works signed-out with 0 auth cookies).

## 6. Findings
### [D-01] Goal target typed with dots saves as Rp 2
- Status: FAIL; Priority: P1; Category: Reliability; Confidence: Verified live
- Route: /savings (Buat Target Tabungan) · 375x812 · light · journey
- Expected: currency input accepts Indonesian format (plan 6.4); placeholder "cth. 1.000.000" must work.
- Actual: field is `type=number`; typing "2.000.000" gives DOM value "2.000000"; Simpan accepted it (1 POST, dialog closed); goal shows "Rp 0 / Rp 2"; edit dialog shows 2. No error.
- Repro: 1. Savings > Buat Target Tabungan 2. name, type 2.000.000 3. Simpan 4. see "Rp 2 sisa".
- User impact: silent corruption of a goal on the exact input the placeholder suggests.
- Evidence: shots S06, S08; agent-D-s3.mjs output `typed dotted -> DOM value: "2.000000"`.
- Acceptance criteria: - [ ] dotted/comma input parsed or rejected with message - [ ] tiny amounts warned - [ ] money inputs use text+numeric grouping like Quick Add.
### [D-02] Savings withdrawal can overdraw to a negative balance
- Status: FAIL; Priority: P1; Category: Reliability; Confidence: Verified live
- Route: /savings > Catat setor atau tarik > Tarik · journey
- Expected: cannot withdraw more than the balance (NN #5).
- Actual: withdrew Rp 999.999.999 from Rp 220.000; accepted; balance "-Rp 999.779.999", history "Saldo: Rp 0". (Reverted with a +999.999.999 correction entry.)
- User impact: corrupt balance; move/allocate cap at available, plain withdrawal does not.
- Evidence: S12, S13. Acceptance: - [ ] withdrawal above balance rejected with message - [ ] enforced server-side.
### [D-03] Removing a split participant silently re-spreads their sole item
- Status: FAIL (Audit 001 #28 second half STILL PRESENT); Priority: P1; Category: UX/Data; Confidence: Verified live
- Route: /split/new · journey
- Expected: unassigned item flagged; shares not silently changed.
- Actual: Rina sole owner of Ayam bakar 32.000; remove Rina -> item becomes assigned to all remaining (host 53.000, Dimas 34.000). No warning.
- Repro: 3+ items, friends Rina and Dimas, assign Ayam bakar to Rina only, remove Rina, read summary.
- User impact: friends over-charged without the host noticing.
- Evidence: E07, section 4. Acceptance: - [ ] removal warns or leaves item flagged - [ ] publish blocked while an item has no owner.
### [D-04] Unset budget shown as the user's Rp 500.000
- Status: FAIL (Audit 001 #36 STILL PRESENT on dashboard export); Priority: P2; Category: Content; Confidence: Verified live (guest) + code `utils/budget.ts:51,74,84`
- Expected: copy does not imply a result the data does not support (6.5).
- Actual: new accounts show "Aman. Rp 500.000 untuk 3 hari lagi", "Rp 0 dari Rp 500.000", menu "Budget Mingguan Rp 500.000", dialog prefilled 500.000, export "Target Anggaran: Rp 500.000", savings-type Saku "Rp 500.000". Archive export now omits budget (improved).
- User impact: false sense of a set budget; wrong figures shared via WhatsApp.
- Evidence: A06, D12, K09. Acceptance: - [ ] unset state prompts "Atur budget" - [ ] export omits or labels default.
### [D-05] Export recap daily average hardcoded to /7
- Status: FAIL; Priority: P2; Category: Content; Confidence: Verified live + code `app/ExportShareModal.tsx:117`
- Actual: monthly recap total 178.500 shows "Rp 25.500/hari" (=/7) and label "Minggu: 1 Nov - 30 Nov"; dashboard month avg is /13 days. Guest week: export 1.714/hari (12.000/7) vs dashboard 2.400 (/5).
- Acceptance: - [ ] average uses elapsed days - [ ] monthly recap says "Bulan".
### [D-06] Compare pace card contradicts headline
- Status: PARTIAL (headline fixed #27); Priority: P2; Category: Content; Confidence: Verified live
- Actual: before adding last Sunday's expense: headline "15% lebih hemat" while pace card "~Rp 1.986 lebih boros per hari" (12.700 5-day avg vs 10.714 7-day avg).
- Evidence: D05, D06. Acceptance: - [ ] both use the same day window.
### [D-07] Monthly view shows three daily figures
- Priority: P3; Category: Content; Confidence: Verified live. Sisa hari ini 32.567, headline 1.147.214 "untuk 18 hari" (63.734/day), "Batas Aman Harian 67.483" (/17 days). Projection prints "-Rp 966.099" for a saving. Acceptance: one denominator, positive wording.
### [D-08] Standard amount field silently alters input
- Priority: P2; Category: UX; Confidence: Verified live. "15.000,50" -> 1.500.050 (100x); "-5" -> 5; "1e5" -> 15; no message. Acceptance: decimals/negatives rejected or parsed explicitly.
### [D-09] Quick Add decimal phrase yields junk name
- Priority: P3; Verified live. "15.000,50 lunch" -> name ",50 Lunch", amount 15.000.
### [D-10] Failures show raw English "Failed to fetch"
- Priority: P2; Category: UX; Confidence: Verified live. Expense, savings (toast low on screen, over overlay), goal, subscription, AI all show "Failed to fetch"; push "Registration failed - permission denied"; auth "Invalid login credentials". Data kept, retry creates no duplicates (good). Expected NN #9. Evidence G01-G05, AI05. Acceptance: Indonesian message with next step.
### [D-11] Closing the add form discards typed data without warning
- Priority: P3; Verified live (Escape closes; reopen shows empty form).
### [D-12] Split item quantity/price inputs unreadable at 375px
- Priority: P2; Category: Responsive/UX; Confidence: Verified live. Qty input 34px wide with 20+8 padding (content 4px); price 68px with 32+10 padding (content 24px); typed "25000" shows ~2 digits. User cannot verify amounts. Sticky total bar overlaps. Evidence E02, E03. Acceptance: price field readable for 8-digit values.
### [D-13] Split rounding not itemised; friend breakdown does not sum
- Priority: P3; Verified live. Default rounding Rp 100: summary 87.000+8.700+4.350 but total 100.200; Rina expanded 43.000+4.300+2.150 = 49.450 vs headline 49.500. Add a "Pembulatan" line.
### [D-14] Search scope unstated; older months unreachable from dashboard
- Priority: P3 (Audit 001 #26 PARTIAL); Verified live. Search covers whole week/month but UI only says "Menampilkan 1 dari 4 entri". 20 Oct item not found in Bulanan, no pointer to Archive. Archive search works; label "1 minggu minggu cocok"; no 0-result message.
### [D-15] "Sisa Anggaran Mingguan Rp 435.000" is hypothetical
- Priority: P2; Category: Content; Verified live. Fresh account with two back-dated entries shows Rp 435.000 "hasil disiplin... dihemat" (past weeks' budget minus recorded spend at today's budget; weeks with no entries excluded) and offers to move it to real savings. Acceptance: explain basis or count only weeks since account start.
### [D-16] Guest limits
- Priority: P3; Verified live. No guest sign-out (menu only "Buat Akun / Masuk"); tapping Patungan as guest redirects home with a generic login dialog and no explanation; guest header date truncates "Jumat, 1...".
### [D-17] Savings-type Saku shows phantom expense budget
- Priority: P3; Verified live. Selecting "Tabungan" on dashboard shows "Rp 500.000 untuk 3 hari lagi". Saku Kos opening balance 400.000 typed at creation appears nowhere (Pantau Saldo Riil off): UNVERIFIED whether discarded.
### [D-18] AI answer details
- Priority: P3; Verified live. Figures match dashboard but "sisa 4 hari lagi" (76.875/hari) vs dashboard 3 days; answer 2 used English categories and its markdown table renders as raw pipes. Disclaimer present; "Menganalisis..." loading state shown, answers in ~3-4 s.
### [D-19] Auth and mixed-language leftovers
- Priority: P3; Audit 001 #34/#38 STILL: no forgot-password, no show-password, raw English auth error; "Ready", "One-Off", split/subscription categories in English, native English validation tooltips.
### [D-20] QR dialog ignores Escape
- Priority: P3; Verified live (keyboard note): aria-modal=true but Escape leaves it open.
### [D-21] Layout polish
- Priority: P3; category chips truncated ("Makana...", "Transpor..."); add-modal mode tabs wrap to two rows; targets: subscription Edit/Jeda/Hapus 26px, email Abaikan/Catat 34px.

## 7. Audit 001 cross-check (24-39, 43, 45)
24 FIXED (full-page welcome, risk copy visible). 25 FIXED (no auth cookie after backdrop/Escape/clicks). 26 PARTIAL (D-14). 27 FIXED headline, pace card D-06. 28 PARTIAL (new items default to all, new friends join "all" items; removal re-spread STILL, D-03). 29 FIXED (notes round-trip in code; no notes field in form; live UNVERIFIED). 30 PARTIAL (Patungan in bottom nav; Langganan/Arsip/Notifikasi still in menu). 31 FIXED (/saku reachable with enable CTA). 32 PARTIAL (modal closes after save, 0 rejected; tabs wrap). 33 PARTIAL (expense field fixed; savings/Saku/split still number, D-01). 34 STILL. 35 FIXED. 36 STILL (dashboard export), FIXED (archive). 37 PARTIAL (no false "Disalin!" when denied; no failure message either). 38 STILL. 39 not reproduced (budget figure matched; day count differed, D-18). 43 PARTIAL (history delete visible; action names changed; figure count not re-counted). 45 UNVERIFIED (single search + Buka/Tutup semua; height not measured).
Strengths still working: Quick Add (preview == saved, 1 POST), pace line ("Aman. Rp X untuk 3 hari lagi"), split friend view (reconciles to the rupiah), guest-risk copy (fully visible), subscription cards (price, countdown, share). Also good: duplicate-submit protection everywhere tested, retry safe, paste-parse email flow, Gmail tutorial clear (7 steps, desktop-Gmail caveat).

## 8. Records created (clean up)
- Guest: 1 anonymous user, created 2026-11-13 02:05:15 +0700, 1 expense "[A002] guest kopi" 12.000. App offers no guest sign-out.
- journey expenses (14 live): [A002] lunch, kopi, gojek (12 Nov), buku kuliah (5 Nov), bensin motor (2 Nov), nonton bioskop (20 Oct), sarapan bubur (10 Nov), makan keluarga (8 Nov), token listrik kos (in Saku Kos), G-test aborted, G-test offline, dup-test slow 5rb, dup-test slow std, [A002] WARUNG UJI KOPI (18.500 via email paste), plus auto-expense "Split: [A002] Makan bareng uji (edit)" 38.000. ([A002] fotokopi was created then deleted.)
- Split bill 1: "[A002] Makan bareng uji (edit)" id fe98bd73-bd41-4a7b-82fd-bc021f443500 (participants [A002] Rina, [A002] Dimas).
- Subscription 1: "[A002] Spotify uji" (36.990, friend [A002] Rina, active).
- Savings: goals "[A002] Laptop uji" (2.000.000, 130.000 allocated) and "[A002] G-test goal" (100.000); ledger: deposits 150.000 and 5.000 ("G-test deposit"), withdrawals 30.000 and 999.999.999 with correction +999.999.999; pokok balance 225.000.
- Wallet: "[A002] Saku Kos" (weekly 150.000); Multi-Saku switched ON for journey; weekly budget 300.000 (Dompet Utama), monthly 1.200.000.
- Email: one queued-then-recorded transaction (ref A002TEST0001); AI: 2 live prompts; photo AI: 1; push: none.

## 9. Not tested / limitations
Photo "Terapkan ke Pengeluaran" (my single upload was spent on extraction, which was correct: 25.000+5.000+3.000 = 33.000, merchant "WARUNG UJI", date 2026-11-13); push delivery (headless Chromium push registration denied; dialog shows "Diblokir oleh browser" even after permission grant, UNVERIFIED cause); subscription notes live; server-side failed fetch; guest upgrade (not clicked by design); Gmail forwarding (tutorial read, not configured); keyboard/screen reader (Agent B).

## 10. Nielsen heuristics (evidence)
1 Status: rows/budget update immediately; failures raw. 2 Real world: mostly Indonesian; "One-Off", "Ready". 3 Control: Escape works; no undo; silent discard (D-11). 4 Consistency: Sisa hari ini differs by toggle; mixed languages. 5 Error prevention: duplicate taps blocked; overdraw/dotted amounts not (D-01, D-02). 6 Recognition: shortcuts good, category chips truncated. 7 Efficiency: Enter to save, shortcuts, keep-open. 8 Minimalist: split form long, savings page many figures. 9 Errors: raw English. 10 Help: Gmail tutorial good; no glossary for Saku/Alirkan.
