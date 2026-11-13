# SakuTrack Audit 002: redesign audit

| | |
|---|---|
| Audit ID | `002-redesign-audit` |
| Date | 2026-11-13 (UTC+7) |
| Commit / branch | `a66510c5c0b7b381d03d01af76c3c482961bfb6a` / `master`, after the Warung redesign (PR #6) and the email-sync PRs (#7, #8) |
| Baseline | `docs/audits/001-initial-audit.md` (2026-11-11, 53 findings, verdict FAIL) |
| Lead auditor | Claude Opus 5.5, with four Claude Sonnet evidence agents (A to D) and one documentation drafter |
| Brief | `docs/audit 002 plan.md` |
| Status | **Final. Do not edit this report.** Track fixes separately and re-test them in a regression audit |

---

## 1. Executive summary and verdict

### Verdict: **BLOCKED**

There is one unresolved **P0**. The live database lets anyone read **every user's split bills**: participant names, itemised purchases, and the payment details (bank, account number, account holder) stored with each bill. The public publishable key, which ships in the app's JavaScript, is enough to list them all. No bill ID is needed. This audit verified it live, using count-only requests.

Even with the P0 fixed, the product would rate **NOT READY**. Four P1 issues hit money correctness and core accessibility:

1. **Savings goal amounts get corrupted.** Typing a goal target the way the field's own placeholder suggests ("2.000.000") silently saves a goal of **Rp 2**.
2. **Savings can be overdrawn.** A withdrawal of Rp 999.999.999 from a balance of Rp 220.000 was accepted, leaving a balance of about −Rp 999,8 million.
3. **Split Bill reallocates silently.** Removing a participant quietly spreads their item across everyone else. Items added by receipt scan default to the host only.
4. **Most form fields have no programmatic label.** This covers 69 of the 87 raw controls, including subscriptions, savings, Saku, split and the standard add-expense form.

### What improved since Audit 001

The redesign fixed a lot. Of Audit 001's 53 items, **23 are fixed, 24 partly fixed, 5 still present and 1 not reproduced. None regressed** (section 8). Highlights:
- Dialogs now share `Dialog`/`ModalOverlay`. In 22 of 24 dialogs tested, Escape, the focus trap and focus return all work.
- Pinch zoom is back, no text is smaller than 12px, reduced motion is respected for CSS, and the home screen leads with "Sisa hari ini" and puts the list on the first screen.
- The compare headline is now normalised to the same number of days.
- First visit is a full page, and no stray tap creates a guest.
- The Saku feature is reachable.
- Light-mode skeletons and the 404 and error pages exist. The service worker serves an offline page without caching private data.
- Every arithmetic check reconciled to the rupiah: budgets, Saku totals, savings ledger, CSV, split friend view. Double-submit and retry never created a duplicate record.

All five strengths that Audit 001 asked us to keep still work: Quick Add's parsed preview, the budget pace line, the split friend view, the guest-risk copy, and the subscription cards.

### Findings at a glance

| Priority | Count | Findings |
|---|---:|---|
| P0 | 1 | A002-01 |
| P1 | 4 | A002-02 to A002-05 |
| P2 | 19 | A002-06 to A002-24 |
| P3 | 26 | A002-25 to A002-50 |

This verdict is an internal release recommendation. It is not a claim of WCAG conformance or certification.

---

## 2. Scope, environment and methodology

**Scope:** every route and shared surface listed in the plan's section 4 was included:
- Dashboard, guest landing and welcome, login and sign-up, account menu
- Add expense (quick, standard, photo), AI sheet
- `/savings`, `/saku`, `/saku/[id]`, `/subscriptions`
- `/split`, `/split/new`, `/split/[id]`, `/split/[id]/edit` (new since Audit 001)
- `/compare`, `/archive`, export, email sync, notifications
- Loading, empty, error and not-found states

API routes were reviewed in code and probed without a session.

| Item | Record |
|---|---|
| Build | `npm run build` exit 0 (Next 16.3.4, Turbopack; every app route is dynamic). `npx tsc --noEmit` exit 0. `npm run lint` exit 1: 13 errors, 27 warnings |
| Server under test | Production build: `next start -p 3100`. Dev server :3000 used only to collect React warnings |
| Backend | Live Supabase project (there is no local database). Test data was created with the owner's approval |
| Browser | Playwright 1.65.0 headless Chromium (HeadlessChrome 158.0.8127.18). Pixel ratio 1. Touch contexts (`hasTouch`, `isMobile`) for accessibility target checks |
| Tools | axe-core 4.13.0, Lighthouse 13.6.0, Node 24.12.0 |
| OS | Windows 11 Home (NT 10.0.26200) |
| Viewports | 320×640, 375×812, 430×932, 768×1024, 1024×768, 1024×1366, 1280×800, 1440×900, plus 375×500 and 640×400 as proxies |
| Themes | Light at every viewport. Dark at 320, 375 and 1280. Palettes orange, pink, blue, mono and hybrid on `/` |
| Auth states | Signed out, guest (one anonymous session), signed in |
| Data states | `empty` (none), `typical` (30 expenses, budgets, 2 Saku, savings, 2 goals, 2 subscriptions, 1 split bill), `large` (600 expenses over 6 months), `journey` (written to during journeys) |
| Network | Normal; Playwright offline; aborted server actions; delayed responses; CDP throttling (400 ms, 100 KB/s); Lighthouse simulated slow 4G with 4× CPU |
| Not available | Screen reader, real devices, field (real-user) performance data |

**Method:**
1. **Preparation.** Lint, typecheck and build; production server; four synthetic test accounts created through the app's own sign-up and seeded by SQL scoped to their user IDs; shared brief (`evidence/002/scripts/AGENT_BRIEF.md`).
2. **Four Sonnet agents, run in parallel in isolated browser contexts:**
   - A: engineering, performance, PWA, plus a code re-check of all 53 Audit 001 items
   - B: accessibility
   - C: responsive, visual and content
   - D: journeys and data integrity

   D was the only agent allowed to write data, and only into `journey` plus one guest.
3. **Lead verification.** I re-ran every P0 and P1 myself, live or in code, and spot-checked P2 claims. I read the live RLS policies (`pg_policies`), which are not in the repo, and probed the REST API anonymously with count-only requests. I reviewed screenshots against their claims.

   Discarded or corrected:
   - My own early observation that the login fields were unlabelled did **not** reproduce, so it was dropped.
   - Agent B's claim of horizontal scroll on `/split/new` at 320px did not reproduce (page width exactly 320), so only a 2px button overflow is reported.
   - Agent D's "Rp 2" goal looked contradicted by the database until I reproduced it on a fresh goal. The original row had been edited later.
4. **Audit-only rule.** No application code, styles, configuration, flags or schema were changed. The tooling-only change is a `prod` entry in `.claude/launch.json`. Two documentation files were moved with `git mv`: `DESIGN.md` → `docs/design/DESIGN.md`, and Audit 001 → `docs/audits/001-initial-audit.md`. Code comments in `app/globals.css:6` and `app/manifest.ts:13` still say "DESIGN.md" without a path; they were left alone because editing them would be a code change.

**Confidence labels used in this report:**

| Label | Meaning |
|---|---|
| **Verified live** | Reproduced by the lead in the running app or live database |
| **Verified in code** | Confirmed by the lead in source |
| **Agent-reported** | Evidence collected by an agent, not independently re-run by the lead (the lead reviewed the evidence file or screenshot) |

---

## 3. Standards used

These are recorded in full in `docs/quality/AUDIT_STANDARDS.md`.

| Standard | Version consulted (2026-11-13) | Role |
|---|---|---|
| WCAG 2.2 Level AA | W3C Recommendation, 12 December 2024 | Formal accessibility target. SC 2.5.8 minimum is 24×24 CSS px |
| WAI-ARIA APG | Living document | Keyboard and focus patterns for dialogs, tabs, menus and disclosures |
| NN/g 10 Usability Heuristics | Last reviewed 30 January 2024 | Usability evaluation (heuristic, not certification) |
| Core Web Vitals (web.dev) | Last updated 31 October 2024 | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 field data |
| Apple HIG, Material Design 3 | Living | Advisory only |
| `docs/design/DESIGN.md` (Warung) | 2026-11-11 | Internal requirements: 44×44 targets, tokens, voice, motion |

Internal targets, such as 44×44 targets and no shadows on cards, are never reported as WCAG failures.

---

## 4. Coverage matrix

### 4.1 Route × state coverage

Statuses: `PASS` / `FAIL` / `PARTIAL` / `N/A` / `UNVERIFIED`. Columns:
- **A11y:** axe plus manual keyboard
- **Resp.:** the viewport matrix
- **Visual:** design-system checks
- **Flow:** functional journey

| Route / surface | Signed out | Guest | Signed in | A11y | Resp. | Visual | Flow |
|---|---|---|---|---|---|---|---|
| `/` dashboard | PASS (welcome page) | PARTIAL (no sign-out) | PASS | PARTIAL (A002-07) | PARTIAL (320 nav label) | PASS | PARTIAL (A002-10) |
| Welcome / guest landing | PASS | n/a | n/a | PASS | PASS | PARTIAL (copy, A002-36) | PASS |
| Login and sign-up dialog | PASS | n/a | n/a | PARTIAL (A002-11) | PASS | PASS | PARTIAL (no password reset) |
| Account menu | n/a | PARTIAL | PASS | PASS | PASS | PASS | PASS |
| Add expense: quick | n/a | PASS | PASS | PARTIAL (checkbox unnamed) | PASS | PARTIAL | PASS |
| Add expense: standard | n/a | n/a | PASS | FAIL (A002-05) | PASS | PARTIAL | PARTIAL (A002-13) |
| Add expense: photo | n/a | n/a | PARTIAL ("Terapkan" step not run) | PASS | PASS | PARTIAL | PARTIAL |
| Edit expense | n/a | n/a | PASS | PASS | PASS | PASS | PASS |
| AI assistant sheet | n/a | n/a | PARTIAL | FAIL (A002-06) | PASS | PARTIAL | PARTIAL (A002-47) |
| `/savings` and dialogs | redirect | n/a | FAIL (A002-02, -03) | PARTIAL (A002-05, -09) | PASS | PARTIAL | FAIL |
| `/saku`, `/saku/[id]` and dialogs | redirect | n/a | PASS | PARTIAL (A002-05, -09, -26) | PASS | FAIL (A002-19) | PASS |
| `/subscriptions` and dialogs | redirect | n/a | PASS | PARTIAL (A002-05) | FAIL at 320 (A002-17) | FAIL (A002-19) | PASS (notes UNVERIFIED live) |
| `/split` | redirect | redirect (A002-38) | PASS | PARTIAL | PARTIAL | FAIL (A002-19) | PASS (failed-fetch empty, A002-12) |
| `/split/new` | redirect | n/a | PARTIAL | FAIL (A002-05) | PARTIAL (A002-18, -33) | FAIL | FAIL (A002-04) |
| `/split/[id]` creator view | n/a | n/a | PASS | PARTIAL (A002-08, -27) | PASS | PARTIAL | PASS |
| `/split/[id]` friend view | PASS | PASS | PASS | PARTIAL (A002-27) | PASS | PASS | PASS (reconciles) |
| `/split/[id]/edit` | redirect | n/a | PASS (non-creator redirected) | FAIL (A002-05) | PARTIAL | FAIL | PASS |
| `/compare` | redirect | n/a | PARTIAL | PARTIAL (A002-27) | PASS | PASS | PARTIAL (A002-15, -30) |
| `/archive` | redirect | n/a | PASS | PASS | PASS | PARTIAL | PARTIAL (A002-36, -40) |
| Export / share | n/a | PARTIAL | PARTIAL | PASS | PASS | PASS | FAIL (A002-10, -14) |
| Email sync settings and paste-parse | n/a | n/a | PASS | PASS | PASS | PASS | PASS |
| Notification settings and push | n/a | n/a | PARTIAL | PARTIAL (4 unnamed controls) | PASS | PARTIAL | UNVERIFIED (headless push denied) |
| Loading skeletons | n/a | n/a | PARTIAL (A002-39) | PASS | PASS | PASS | n/a |
| Empty states (`empty` account) | n/a | n/a | PARTIAL (A002-39) | PASS | UNVERIFIED at 320 | PASS | PARTIAL |
| Error and not-found | PASS (307 to welcome) | n/a | PARTIAL (A002-32) | PASS | PASS | PASS | PARTIAL |
| Offline | PASS (offline page) | n/a | PARTIAL (A002-25) | n/a | n/a | PASS | PARTIAL |

### 4.2 Critical journeys (plan §7)

| Journey | Result | Pass condition met? | Key evidence |
|---|---|---|---|
| A First-time visitor | **PASS** | Yes. Five stray interactions plus Escape, close, cancel and backdrop left 0 auth cookies. Exactly one guest was created, through its button. P3: guests can't sign out (A002-38) | `D-A01-initial.png`, `D-A06-guest-dashboard.png` |
| B Record an expense | **PARTIAL** | Mostly. Preview matches what is saved; double-click, triple Enter and a slow server all produced exactly 1 row. But "15.000,50" saves as 1.500.050 (A002-13) | Agent D §4 arithmetic |
| C Find an older expense | **PARTIAL** | Search covers the selected week or month, but the scope isn't stated and older months are only reachable from Archive (A002-36) | D-14 |
| D Understand the budget | **PARTIAL** | Arithmetic is correct and the headline is normalised. But an unset budget shows as Rp 500.000, the pace card and export average use a different number of days, and the "Sisa Anggaran" surplus is hypothetical (A002-10, -14, -15, -16) | `D-D05`, `D-D06`, `D-D12` |
| E Split a bill | **FAIL** | No. Removing a participant silently re-spreads their item (A002-04). The typical bill's friend view reconciles exactly: 37.950 / 49.450 / 12.650, total 100.050 | `D-E07-after-remove-rina.png`, `D-E04` |
| F Edit a subscription | **PARTIAL** | The split config and price survive an edit (live). Notes survive only in code; the form has no notes field to check them live (A002-50) | `SubscriptionsClient.tsx:181,228` |
| G Failure and recovery | **PARTIAL** | Feedback appears, typed data is kept and retries never duplicate. But the message is raw English "Failed to fetch" (A002-11), and failed reads render as empty in code (A002-12) | `D-G01`, `D-G02` |
| H Keyboard and assistive technology | **PARTIAL** | The main workflow works by keyboard. The AI sheet isn't contained (A002-06), focus hides under the bottom bar (A002-07), and the screen-reader pass is UNVERIFIED | Agent B §4 |

---

## 5. Automated test results

| Check | Command / configuration | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | exit 0 |
| Lint | `npm run lint` (ESLint 9, `eslint-config-next` 16.3.4) | exit 1: 13 errors (5 `set-state-in-effect`, 6 `no-explicit-any`, 1 `immutability`, 1 compiler skip), 27 warnings. Every error line predates Audit 001 (git blame, 11–12 Oct 2026). `evidence/002/data/lint.log` |
| Build | `npm run build` | exit 0. 23 app routes, all dynamic (ƒ) except icon, manifest and robots. `evidence/002/data/build.log` |
| Unit and e2e tests | none exist in the repo | N/A: no test suite (`scripts/test-*parser.mjs` are ad hoc) |
| axe-core 4.13.0 | Injected via Playwright on 15 routes × light/dark × 3 auth states, and on 24 dialogs | 0 violations on `/`, `/savings`, `/archive`, login and the email-sync dialog. Critical `label`, `select-name` and `button-name` violations on `/split/new`, `/split/[id]/edit`, and the Saku, savings, subscription and notification dialogs. `landmark-one-main` on `/saku`, `/saku/[id]`, `/subscriptions`. `color-contrast` on `/compare`, `/split/[id]`, `/split/new`. Detail: `evidence/002/agent-reports/B.md` §3. **Automated and partial. It is not an accessibility audit on its own.** |
| Lighthouse 13.6.0 | Mobile preset, simulated throttling, 3 runs per route, `disableStorageReset` for signed-in runs | See below. **Lab data only.** |
| Playwright smoke and journeys | `evidence/002/scripts/agent-D-*.mjs` | Journeys table in §4.2 |
| Console and network | Dev and prod, 9 routes plus the account menu | 0 console errors, 0 warnings, 0 failed requests. The Audit 001 React key warning did not reproduce |
| Bundle | `.next/static`, gzip level 6 | All JS 571,353 B gzip (Audit 001: 463,942; +23%, cause not traced). CSS 140,414 B raw / 19,615 B gzip (was 164,470 raw). First-load JS (gzip, without the noModule polyfill): `/` 283,762 B; other routes 189,857–205,242 B |

**Lighthouse lab results** (median of 3, [min–max]). INP can't be measured in navigation mode, and there is no field data, so field CWV are **UNVERIFIED**. Other agents were using the machine during these runs.

| Route | Score | LCP ms | CLS | TBT ms |
|---|---:|---:|---:|---:|
| `/` signed out | 95 | 1,072 | 0 | 253 |
| `/` signed in | 88 | **3,261** [3,163–3,414] | 0 | 237 |
| `/savings` | 86 | **3,274** [3,165–3,404] | 0 | 297 |
| `/compare` | 92 | **2,964** [2,895–2,979] | 0 | 180 |
| `/split/[id]` friend view | 92 | 1,086 | 0 | 357 |
| `/` with 600 expenses (1 run) | 92 | **3,171** | 0 | 139 |

---

## 6. Findings register

IDs are `A002-NN`. P0 and P1 findings use the full template. P2 and P3 use the same fields in compact form; full reproduction detail is in the agent report cited under Evidence. Screenshots are under `docs/audits/evidence/002/screenshots/`.

### P0: Critical

#### [A002-01] Every user's split bills, participants and payment details are readable by anyone
- Status: FAIL
- Priority: P0
- Category: Security / Privacy (Reliability)
- Confidence: **Verified live** (lead)
- Route: Supabase REST API (`/rest/v1/split_bills`, `split_participants`, `split_items`)
- Viewport, theme: n/a
- Auth state: anonymous (publishable key only)

**Expected behaviour**
- A bill is readable only by its creator, plus whoever holds the link to that one bill (the friend view).
- Bank account details stored with a bill are not listable by the public.
- Reference: plan §6.6 "Authentication and authorization boundaries are respected", and P0 "private data exposure".

**Actual behaviour**
- The live policies (`pg_policies`) grant `SELECT` to role `public` with `USING (true)` on all three tables: "Public read split_bills", "Public read split_participants", "Public read split_items".
- An anonymous REST request using only the publishable key returned counts for **all** rows:
  - `split_bills` 7, from **4 distinct creators**
  - `split_participants` 26
  - `split_items` 15
  - 7 of 7 bills have `payment_info` filled in (bank method, account number, account name)
- 2 of those 7 bills, and 2 of the 4 creators, were this audit's own test accounts (`typical`, `journey`). After cleanup, **5 real bills from 2 real users** remain exposed (the split_bills count is 5 after deletion).
- No bill ID is needed; the table can simply be listed. I requested counts only and printed no row contents.
- The repo's `supabase/schema.sql:301-317` carries the same policies, so this is long-standing, not a regression. Audit 001 didn't test it.

**Reproduction steps**
1. `HEAD {SUPABASE_URL}/rest/v1/split_bills?select=id` with headers `apikey: <publishable key>`, `Prefer: count=exact`, `Range: 0-0`.
2. Read `Content-Range`: `0-0/7`.
3. Add the filter `&payment_info=not.is.null`. The count is still 7.

**User impact**
- Anyone who reads the public key from the site's JavaScript can harvest every user's bill titles, friends' names, what they bought, and bank account numbers and holder names.
- This affects every user who has ever created a split bill, and the friends listed in those bills.

**Evidence**
- `pg_policies` query output: three public `SELECT` policies with `qual = true`.
- Anonymous count probes, recorded in this report.
- Source: `supabase/schema.sql:301-317`. `app/split/[id]/page.tsx` relies on public read for the friend view.

**Acceptance criteria**
- [ ] An anonymous `GET /rest/v1/split_bills?select=id` returns 0 rows, or 401/403, and the same holds for participants and items.
- [ ] The friend view still loads one bill by its ID without an account, served by a `SECURITY DEFINER` function, a server-side service call, or an unguessable share token, and it cannot enumerate other bills.
- [ ] `payment_info` reaches the friend view only for the bill being viewed. The owner decides whether account numbers belong there at all.
- [ ] The owner reviews whether the existing exposure needs to be disclosed to affected users.

**Reference:** plan §6.6, P0 definition. OWASP API Security Top 10: API1 Broken Object Level Authorization.

### P1: High

#### [A002-02] A savings goal target typed in the placeholder's own format saves as Rp 2
- Status: FAIL
- Priority: P1
- Category: Reliability (financial data integrity)
- Confidence: **Verified live** (lead reproduced it on a fresh goal)
- Route: `/savings` › Tambah Target Baru
- Viewport, theme: 375×812, light
- Auth state: signed in (`journey`)

**Expected behaviour**
- The amount field accepts Indonesian grouping ("2.000.000"), or rejects it with a message.
- Reference: plan §6.4 "Currency input accepts the intended Indonesian number format"; NN/g heuristic #5 error prevention.

**Actual behaviour**
- The target field is `type="number"` with placeholder "cth. 1.000.000".
- Typing `2.000.000` leaves the DOM value as `"2.000000"`. Simpan saves it with no warning.
- The goal card then reads "Rp 0 / Rp 2", "Rp 2 sisa".

**Reproduction steps**
1. Open `/savings` and tap "Tambah Target Baru".
2. Type a name, then type `2.000.000` in the target field.
3. Tap Simpan. The card shows "Rp 0 / Rp 2".

**User impact**
- A student following the placeholder sets a goal 1,000,000× too small.
- Progress, "sisa" and allocation logic are wrong from then on, with no signal that anything went wrong.

**Evidence**
- `lead-d01-goal-dotted-typed.png`, `lead-d01-goal-saved-rp2.png`
- `D-S06`/`S08` (agent D)
- Code: `type=number` money inputs in `app/savings/SavingsClient.tsx` (5), `app/split/new/SplitBillCreator.tsx` (6), `app/QuickAddExpense.tsx:1865`

**Acceptance criteria**
- [ ] Every money input (savings, Saku, split, subscriptions) uses the shared `MoneyField` (text with numeric input mode, `id-ID` grouping) or an equivalent.
- [ ] Typing `2.000.000` in any money field stores 2000000.
- [ ] Input that can't be parsed shows an inline error, and nothing is saved.

**Reference:** plan §6.4 Forms; NN/g heuristic #5.

#### [A002-03] Savings withdrawal can overdraw the balance into a large negative number
- Status: FAIL
- Priority: P1
- Category: Reliability (financial data integrity)
- Confidence: **Verified live** (lead read the stored ledger rows) and **Verified in code**
- Route: `/savings` › Catat setor atau tarik › Tarik
- Viewport: 375×812
- Auth state: signed in (`journey`)

**Expected behaviour**
- You can't withdraw more than the available balance. Validation happens on the server, not only in the UI.
- Reference: NN/g heuristic #5; plan §6.6 "Totals reconcile".

**Actual behaviour**
- A withdrawal of Rp 999.999.999 against a balance of Rp 220.000 was accepted.
- The balance shows "−Rp 999.779.999" while the history shows "Saldo: Rp 0".
- The server action (`app/actions.ts`, savings adjustment around lines 1026–1057) checks only `amount > 0` before inserting an `adjustment` row. It never compares against the stash balance.
- Move and allocate actions are capped; plain withdrawal isn't.
- Agent D reverted the test with a correction entry.

**Reproduction steps**
1. Open `/savings` › "Catat setor atau tarik".
2. Choose Tarik and enter 999999999.
3. Save. The balance goes negative.

**User impact**
- The savings balance, the figure students use to decide what they can afford, can be corrupted by a typo, such as an extra zero.

**Evidence**
- `D-S12-overdraw.png`, `D-S13-after-overdraw.png`
- Ledger rows "adjustment Penarikan Tabungan 999999999" and "[A002] koreksi overdraw" in the `journey` account
- `app/actions.ts:1026-1057`

**Acceptance criteria**
- [ ] A withdrawal above the available balance is rejected on the server, with an Indonesian message.
- [ ] The UI shows the available balance and blocks submission above it.
- [ ] The balance can never go below 0 through any savings action.

**Reference:** NN/g heuristic #5; plan §6.6.

#### [A002-04] Split Bill silently changes who owes what when a participant is removed. Scanned items default to the host only
- Status: FAIL (Audit 001 #28, partly still present)
- Priority: P1
- Category: UX / Reliability (financial correctness)
- Confidence: **Verified in code** (lead) and agent-reported live
- Route: `/split/new`, `/split/[id]/edit`
- Viewport: 375×812
- Auth state: signed in

**Expected behaviour**
- Every allocation is explicit. No item is silently given to the wrong person.
- Reference: plan §7 Journey E pass condition; §6.6 "Split Bill allocations reconcile".

**Actual behaviour**
1. **Removing a participant.** If the removed person was an item's only assignee, `handleRemoveParticipant` (`SplitBillCreator.tsx:469-480`) reassigns that item to everyone remaining, with no warning. Live example: "Ayam bakar" Rp 32.000, assigned only to Rina. After removing Rina, the host's share went from 33.000 to 53.000 and Dimas's from 11.000 to 34.000. The total still reconciles, so the error is invisible in the total.
2. **Scanned items.** Items created from a receipt scan are assigned `[creatorPartId]` only (`:251`, `:267`), even when friends are already added.
3. **Calculator fallback.** `utils/splitCalculator.ts:146-148` still splits an empty assignment "with all".

What is fixed: manually added items now default to everyone, and newly added friends join items that everyone shares.

**Reproduction steps**
1. On `/split/new`, add three items and the friends Rina and Dimas.
2. Assign "Ayam bakar" to Rina only.
3. Remove Rina and read the summary.

**User impact**
- Friends are over-charged (or the host under-charged) without the host noticing, and the result is then published to friends as a payment request.

**Evidence**
- `D-E06-before-assign.png`, `D-E07-after-remove-rina.png`
- Agent D §4 arithmetic
- `SplitBillCreator.tsx:251,267,469-480`; `splitCalculator.ts:146-148`

**Acceptance criteria**
- [ ] Removing a participant who is an item's only assignee leaves the item visibly "Belum dibagi" (unassigned), or asks the user how to reassign it.
- [ ] Publishing is blocked while any item has no assignee.
- [ ] Scanned items use the same default as manual items.
- [ ] The calculator never silently spreads an unassigned item.

**Reference:** plan §7 Journey E; §6.6.

#### [A002-05] Most form fields have no programmatic label
- Status: FAIL (Audit 001 #2, improved but still failing)
- Priority: P1
- Category: Accessibility
- Confidence: **Verified in code** (lead re-ran the counts) and agent-reported live (axe)
- Routes:
  - Pages: `/split/new`, `/split/[id]/edit`
  - Dialogs: add expense (standard form, quick-mode checkbox), savings (goal, allocate, withdraw, move, balance), Saku (create, transfer, income), subscription add and edit, notifications
- Viewport: 375×812
- Theme: both
- Auth state: signed in

**Expected behaviour**
- Every field has a programmatically associated label (`for`/`id`, a wrapping `<label>`, or `aria-label`). A placeholder alone is not a label.
- Reference: WCAG 2.2 SC 1.3.1, 3.3.2, 4.1.2.

**Actual behaviour**
- `app/` has 59 `<label>` elements but only 6 `htmlFor`.
- Of 87 raw `<input>`/`<select>`/`<textarea>` elements, a heuristic parse found no programmatic label on **69**.
- `app/ui/Field.tsx` does this correctly (`useId`, `htmlFor`, `aria-describedby`, `aria-invalid`) but is used in only 3 files.
- axe reports critical `label` and `select-name` violations in 12 dialogs and on 2 pages.
- In the subscription add dialog, 7 of 7 `<label>`s are unlinked.
- In the standard add-expense form, the amount field is named only "0" (its placeholder) and the name field only by its placeholder.

**Reproduction steps**
1. Open the subscription add dialog.
2. Run axe, or inspect the accessibility tree. Fields are announced without their visible labels.

**User impact**
- Screen-reader users hear "edit text" or "combo box" with no purpose in core money forms.
- Tapping a visible label doesn't focus its field.

**Evidence**
- `evidence/002/agent-reports/B.md` (B-03), with `B-axe-routes.json` and `B-dialogs-*.json` referenced there
- `docs/design/COMPONENT_GUIDELINES.md` §6, which lists the unlabelled controls by `file:line`

**Acceptance criteria**
- [ ] axe `label` and `select-name` report 0 violations on every route and dialog listed above.
- [ ] Every visible field label is connected to its field (`Field.tsx` or `htmlFor`/`id`).
- [ ] Fields that have only a placeholder get a visible label or an `aria-label`.

**Reference:** WCAG 2.2 SC 1.3.1, 3.3.2, 4.1.2.

### P2: Medium

Compact template: Status · Category · Confidence · Route · Expected → Actual · Repro · Impact · Evidence · Acceptance criteria.

#### [A002-06] The AI assistant sheet doesn't move or contain focus
- FAIL · Accessibility · **Verified live** (lead) · `/` › Asisten Keuangan AI, 375×812
- **Expected:** APG modal dialog: focus moves into the sheet and Tab stays inside (WCAG 2.4.3).
- **Actual:**
  - The sheet has `role="dialog"` and closes on Escape.
  - Focus stays on the invoker behind the sheet. **21 of 30** Tab presses land outside it.
  - It is the only hand-rolled overlay (`app/ai/AiAssistantSheet.tsx:281`); it doesn't use `Dialog`.
- **Repro:** Focus the AI button, press Enter, then press Tab repeatedly.
- **Impact:** Keyboard and screen-reader users interact with the dashboard behind an open chat.
- **Why P2 and not P1:** it is a secondary feature, and Escape works.
- **Evidence:** `B-dlg-ai-sheet-light.png`; lead script `lead-verify-b.mjs`.
- **AC:**
  - [ ] Focus moves into the sheet on open and returns to the invoker on close.
  - [ ] 0 of 30 Tab presses leave the sheet.
  - [ ] The sheet is migrated to `Dialog`.

#### [A002-07] Focused list rows are fully hidden behind the fixed bottom bar
- FAIL · Accessibility · Agent-reported (lead reviewed the screenshot; the lead's own probe on the 2-row "Hari Ini" list couldn't reach the bottom edge) · `/` week and month lists, `/archive`, `/savings`, 375×812
- **Expected:** WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum).
- **Actual:**
  - There is no `scroll-padding` anywhere.
  - Tabbing to a row near the bottom scrolls it only to the viewport edge, where it sits under the nav and the Add button. `elementFromPoint` returns the Add button.
- **Impact:** Keyboard users can't see which row is focused before pressing Enter.
- **Evidence:** `B-wcag-2411-obscured-focus.png`; B-02.
- **AC:**
  - [ ] `scroll-padding-bottom` is at least the bar height.
  - [ ] No focus stop is fully covered.

#### [A002-08] Escape doesn't close the split QR dialog or the split delete confirmation
- FAIL · Accessibility / Interaction · **Verified live** (lead) and **Verified in code** · `/split/[id]`
- **Expected:** APG dialog: Escape closes it and focus returns to the opener.
- **Actual:**
  - The dialog stays open after Escape.
  - Cause: `ModalOverlay` handles Escape by clicking a button that contains `svg.lucide-x`, and otherwise falls back to the caller's `onMouseDown`. The QR "Tutup" button has no X icon, and neither dialog provides a backdrop handler.
- **Evidence:** `B-dlg-split-qr-light.png`; `docs/design/COMPONENT_GUIDELINES.md` §2.
- **AC:**
  - [ ] Escape closes both dialogs and focus returns to the opener.
  - [ ] `ModalOverlay` (or its replacement) no longer depends on an icon class to close.

#### [A002-09] Icon-only buttons have no accessible name
- FAIL · Accessibility · Agent-reported (axe `button-name`) · Savings dialogs (close button, 16×16), Saku create/edit (close plus 10 emoji/colour pickers), streak dialog close, subscription row actions
- **Expected:** WCAG 4.1.2.
- **Actual:** Close and picker buttons are announced as "button".
- **Evidence:** B-04; `B.md` dialog matrix.
- **AC:**
  - [ ] axe `button-name` reports 0 across all dialogs.
  - [ ] Pickers announce their value, for example "Warna hijau, dipilih".

#### [A002-10] A budget the user never set is shown as Rp 500.000, including on the dashboard and in exports
- FAIL (Audit 001 #36, partly) · Content / financial clarity · **Verified live** (lead, fresh account) and **Verified in code**
- **Expected:** Plan §6.5: copy doesn't imply a result the data doesn't support.
- **Actual:**
  - A new account reads "Aman. Rp 500.000 untuk 3 hari lagi", "Rp 0 dari Rp 500.000 minggu ini" and "Sisa hari ini Rp 166.667".
  - The menu, the budget dialog's pre-filled value, the dashboard export ("Target Anggaran: Rp 500.000") and savings-type Saku show the same figure.
  - Source: hard-coded fallbacks in `utils/budget.ts:51,74` and `utils/wallets/server.ts:273`.
  - The Archive export no longer shows a budget, which is an improvement.
- **Impact:** A false sense that a budget is set, and wrong figures shared to friends over WhatsApp.
- **Evidence:** `D-D12-guest-export-default500k.png`, `A-pwa-02-empty-online.png`.
- **AC:**
  - [ ] With no budget set, the dashboard shows an "Atur budget" state instead of an allowance.
  - [ ] Exports omit the budget, or label it as not set.

#### [A002-11] Errors are raw English. There is no password reset, no show-password toggle, and the sign-in error isn't announced
- FAIL (Audit 001 #34, still present) · UX / Content / Accessibility · Agent-reported live (D, B) and agent-verified in code (A)
- **Expected:**
  - NN/g heuristic #9.
  - WCAG 3.3.1 and 4.1.3 (errors identified and announced).
  - WCAG 3.3.8, which doesn't require a reset path, though one is good practice for recovery.
- **Actual:**
  - Every failed save (expense, savings, goal, subscription, AI) shows "Failed to fetch".
  - Sign-in shows "Invalid login credentials". `app/actions.ts:46,108,166,195,254` pass `error.message` through unchanged.
  - The sign-in error has no `role="alert"` or `aria-invalid`.
  - There is no forgot-password flow and no reveal toggle.
- **Good:** typed data is kept, and a retry never duplicates.
- **Evidence:** `D-G01-expense-aborted.png`, `D-G02-expense-offline.png`, `B-auth-1-login.png`; A-07, B-12, D-10.
- **AC:**
  - [ ] Known errors map to Indonesian messages with a next step.
  - [ ] Auth errors are announced and tied to the field.
  - [ ] A password-reset path exists.

#### [A002-12] A failed data read looks like an empty account
- FAIL · Reliability · Agent-reported (verified in code by A; live injection fell back to a full-page load)
- **Expected:** Plan §6.6: failed requests don't masquerade as empty data.
- **Actual:**
  - Server pages take only `data` from their Supabase queries (`app/page.tsx:127-150` and the savings, compare, archive, subscriptions and Saku pages).
  - `app/split/page.tsx:58-60` logs the error and renders "no bills yet".
- **Impact:** A transient outage looks like lost data.
- **AC:**
  - [ ] A query error renders an error state with a retry, distinct from the empty state.

#### [A002-13] The standard expense amount field silently changes what was typed
- FAIL · UX / financial correctness · **Verified in code** (lead) and agent-reported live
- **Expected:** Plan §6.4: currency input accepts the Indonesian format, and invalid input is rejected visibly.
- **Actual:**
  - `QuickAddExpense.tsx:1143` strips every non-digit.
  - "15.000,50" becomes **1.500.050** (100×), "-5" becomes 5, and "1e5" becomes 15. There is no message.
- **AC:**
  - [ ] A decimal comma is either parsed as decimals or rejected with a message.
  - [ ] A negative or non-numeric entry shows an error.

#### [A002-14] The export recap's daily average always divides by 7
- FAIL · Content / financial clarity · **Verified in code** (lead) and agent-reported live
- **Actual:**
  - `ExportShareModal.tsx:117` uses `dailyAvg: Math.round(total / 7)`.
  - Mid-week, the export shows Rp 9.071/day where the dashboard shows Rp 12.700/day (÷5).
  - The monthly recap shows Rp 25.500/day (178.500 ÷ 7) and is labelled "Minggu".
- **AC:**
  - [ ] The average uses the days elapsed in the period.
  - [ ] The monthly recap is labelled "Bulan".

#### [A002-15] The compare pace card contradicts the normalised headline
- PARTIAL (Audit 001 #27: headline fixed) · Content · **Verified in code** (lead) and agent-reported live
- **Actual:**
  - The headline compares the same number of days (fixed).
  - The pace card compares `thisTotal / todayDayIndex` against `lastTotal / 7` (`compare/page.tsx:144-145`), so one screen can say "15% lebih hemat" and "~Rp 1.986 lebih boros per hari".
- **Evidence:** `D-D05-compare-before.png`, `D-D06-compare-after.png`.
- **AC:**
  - [ ] Both figures use the same day window, or the card states its basis.

#### [A002-16] "Sisa Anggaran Mingguan" presents a hypothetical surplus as money saved
- FAIL · Content / financial clarity · Agent-reported live
- **Actual:**
  - A fresh account with two back-dated entries shows "Rp 435.000, hasil disiplin belanja… dihemat" and offers to move it into savings.
  - The figure is past weeks' budget minus recorded spending, using today's budget. Weeks with no entries are excluded.
- **Evidence:** `D-S08`; D-15.
- **AC:**
  - [ ] The surplus counts only weeks since the account started (or since the budget was set), and its basis is explained.

#### [A002-17] `/subscriptions` scrolls horizontally at 320px
- FAIL · Responsive · **Verified live** (lead: scrollWidth 338 vs 320)
- **Expected:** WCAG 1.4.10 Reflow.
- **Actual:** The card action row (Bayar, pause, edit, delete) overflows, and the delete button sits partly off-screen.
- **Evidence:** `lead-subscriptions-320-overflow.png`, `C-subscriptions__320x640__light__full.png`.
- **AC:**
  - [ ] scrollWidth equals clientWidth at 320px.
  - [ ] All card actions are visible.

#### [A002-18] Split item quantity and price inputs are unreadable at 375px
- FAIL · Responsive / UX · Agent-reported live
- **Actual:**
  - The quantity input is 34px wide with 4px of usable content width. The price field shows about 2 digits of "25000".
  - The sticky total bar overlaps the content.
- **Evidence:** `D-E02-items-after-friends.png`, `D-E03-row-clip.png`.
- **AC:**
  - [ ] An 8-digit price is fully readable at 320 and 375px.

#### [A002-19] Outside the home screen, the design system hasn't converged
- FAIL · Visual · **Verified in code** (lead spot-checked counts) and agent-reported live
- **Expected:** `docs/design/DESIGN.md`: semantic tokens only, radius 12/16/full, no card shadows, one accent.
- **Actual:**
  - 4,326 legacy colour-class uses against 744 semantic ones.
  - 209 `shadow-*` uses, with card shadows on 9 of 10 routes.
  - Radii of 24, 8, 6 and 2px.
  - Raw hex colours in the Saku picker and charts.
  - Two dialog primitives, 7 separate toast implementations, and 283 raw `<button>`s against 16 `<Button>`s.
  - Home is clean. `/saku`, `/subscriptions` and `/split` read as a different product.
- **Evidence:** `C-saku__375x812__light__full.png` vs `C-home__375x812__light__full.png`; `docs/design/DESIGN_TOKENS.md` §11; `COMPONENT_GUIDELINES.md` §7.
- **AC:**
  - [ ] Routed pages use token class names only.
  - [ ] Radii are limited to 12, 16 and full.
  - [ ] No card shadows.
  - [ ] There is one toast component.

#### [A002-20] The dashboard's server waterfall is unchanged since Audit 001
- FAIL (Audit 001 #48, still present) · Performance · Agent-reported (verified in code by A)
- **Actual:**
  - 3 `auth.getUser` network calls per full load (`utils/supabase/proxy.ts:85`, `app/page.tsx:52`, `subscriptions/actions.ts:260`).
  - `wallet_balances` is read twice.
  - An unbounded all-time `spent_at` query computes the streak.
  - About 7 sequential steps; subscription-renewal writes run inside the render.
- **AC:**
  - [ ] One auth call per request.
  - [ ] Wallet balances are read once.
  - [ ] The streak query is bounded.
  - [ ] Independent queries run in parallel.

#### [A002-21] Signed-in lab LCP is above 2.5 s
- FAIL (lab only) · Performance · Agent-reported (Lighthouse JSON reviewed by the lead)
- **Actual:**
  - Median LCP: `/` 3,261 ms, `/savings` 3,274 ms, `/compare` 2,964 ms.
  - FCP is about 1.07 s. The LCP element is the hero text, with 0.5–0.8 s of render delay.
  - The cause isn't proven; font swap or hydration are hypotheses.
- **Evidence:** `evidence/002/data/A-summary-typical.json`.
- **AC:**
  - [ ] Lab LCP ≤ 2.5 s on these routes.
  - [ ] Field LCP p75 ≤ 2.5 s once field data exists.

#### [A002-22] Input and control borders fail non-text contrast
- FAIL · Accessibility · Agent-reported
- **Expected:** WCAG 1.4.11, 3:1.
- **Actual:**
  - Input borders measure 1.18–1.31:1 against their background.
  - Pressed and unpressed toggles differ by 1.06–1.11:1 in background, though text weight and colour also change.
- **AC:**
  - [ ] Field boundaries reach ≥ 3:1, or the field is identifiable another way.

#### [A002-23] Silent failures remain on some deletes, and native `alert`/`confirm` is still used
- PARTIAL (Audit 001 #9) · Reliability / UX · Agent-reported (verified in code by A)
- **Actual:**
  - `handleDeleteGoal` (`SavingsClient.tsx:176-185`) and `handleDeleteEntry` (`SavingsBalanceHistory.tsx:146-155`) use `try/finally` with no `catch`.
  - Email approve and dismiss only `console.error` (`PendingTransactionsBanner.tsx:57,74,101`).
  - There are 19 native `alert()`/`confirm()` calls.
- **AC:**
  - [ ] Every mutation shows an in-app error when it fails.
  - [ ] Destructive confirmations use the app dialog.

#### [A002-24] The selected state of pickers and add-dialog mode buttons is shown by colour only
- FAIL · Accessibility · Agent-reported
- **Expected:** WCAG 1.4.1, 4.1.2.
- **Actual:** Category, Saku, emoji and colour pickers and the Ketik Cepat / Standar / Upload Foto buttons expose no `aria-pressed` or `aria-selected`, and selection is only a colour change.
- **AC:**
  - [ ] The selected state is exposed programmatically, and visible without relying on colour.

### P3: Low

Each P3 finding carries a confidence label, its evidence, and one acceptance criterion. All are FAIL or PARTIAL.

| ID | Finding | Category | Confidence | Evidence | Acceptance criterion |
|---|---|---|---|---|---|
| A002-25 | Offline writes aren't queued or explained in plain language. The service worker only registers where Push is supported, so iOS Safari tabs never get the offline page | PWA | Agent-reported (code) | `public/sw.js:19-24`, `utils/pwa/pushManager.ts:3-10,33` | The SW registers wherever service workers exist, and an offline save shows an Indonesian "not saved, try again" message |
| A002-26 | 11 of 12 routes share one `<title>`. No `<main>` on `/saku`, `/saku/[id]`, `/subscriptions`. Heading-order skips | Accessibility | **Verified live** (titles, lead); landmarks agent-reported | B-06, B-07, B-14 | Each route has a unique title and one `<main>`, and axe `heading-order` is clean |
| A002-27 | Remaining text-contrast failures: the friend view's payment line is 2.94:1 (light); compare future-day labels are 1.86:1 (light) and 2.23:1 (dark); `/split/new` 4.47:1 | Accessibility | Agent-reported | B-13 | All text ≥ 4.5:1 (or ≥ 3:1 when large) |
| A002-28 | Split viewer confetti ignores reduced motion. `qrcode` and `canvas-confetti` are static imports, and the QR code is generated on mount | A11y / Perf | Agent-reported (code) | `SplitBillViewer.tsx:19-20,98-104` | `disableForReducedMotion: true`, and QR and confetti load on demand |
| A002-29 | `toggleParticipantPaid` has no creator check. RLS blocks the write, but the action still returns `{success:true}` | Reliability | **Verified in code** and live RLS (lead) | `app/split/actions.ts:228-262` | A non-creator gets an explicit error |
| A002-30 | Compare shows "0% lebih boros" when there was no spending to compare against. Empty `/compare` claims "lebih hemat ~Rp 0 per hari" | Content | **Verified in code** (lead) and agent-reported | `compare/page.tsx:137-139`; C-07 | With no baseline, show the amount only and neutral copy |
| A002-31 | Mixed language and voice: English categories, "Pacing", "burn rate", "One-Off"; "Anda" vs "kamu"; exclamation marks; 5 date formats including ISO; English mode leaves `/saku` and the add dialog in Indonesian | Content | Agent-reported live | C-06 to C-09, A-14 | One language per session, one date helper, no ISO dates on screen |
| A002-32 | Unknown `/split/<id>` and `/saku/<id>` return HTTP 200 with the not-found page | Reliability | **Verified live** (lead) | C-10 | Unknown IDs return 404 |
| A002-33 | At 320px, "Publikasikan" overflows its bar by 2px, the nav label "Bandingkan" is truncated, and home summary rows cut off the amount instead of the name | Responsive | Agent-reported live | C-02, C-03, C-13 | Labels and amounts are fully visible at 320px |
| A002-34 | Closing the add dialog with Escape or Tutup discards typed data without warning | UX | Agent-reported live | B-17, D-11 | Warn before discarding, or keep a draft |
| A002-35 | Split rounding isn't itemised: shares show 100.200 against 87.000 + 8.700 + 4.350 = 100.050, and the friend breakdown doesn't add up to the headline | Content | Agent-reported live | D-13 | A "Pembulatan" line makes every breakdown add up |
| A002-36 | The search scope isn't stated. Older months can't be reached from dashboard search. Archive shows "1 minggu minggu cocok" and no zero-result message | UX | Agent-reported live | D-14 | Results state their scope and link to Archive; Archive copy fixed |
| A002-37 | The monthly view shows three different daily figures, and the projection prints "−Rp 966.099" for money saved | Content | Agent-reported live | D-07 | One daily figure per view, and positive wording for savings |
| A002-38 | Guests can't sign out, and tapping Patungan as a guest bounces to a generic login with no explanation | UX | Agent-reported live | D-16 | Guests have a sign-out, and restricted routes explain why |
| A002-39 | `/split` and `/saku` borrow the home-shaped skeleton. Empty home and `/compare` give no next step | UX | Agent-reported live | C-11, C-12 | Skeletons match their routes, and empty states name the first action |
| A002-40 | Expanding every archive week grows the page to 26,629px and 4,304 DOM nodes (600 entries), with no cap | Performance | Agent-reported live | C-14 | Expanded weeks paginate or cap entries |
| A002-41 | `UpgradeAccountModal` is a static import, which puts an 89 KB gzip Supabase chunk in `/`'s first load | Performance | Agent-reported (code) | A-03 | Load it on demand, and `/`'s first-load gzip drops accordingly |
| A002-42 | 13 lint errors, and lint isn't part of the build | Engineering | **Verified live** (lead ran lint) | `data/lint.log` | `npm run lint` exits 0 and runs in CI |
| A002-43 | Targets under 44px remain on forms and the split editor (`/split/[id]/edit`: 65 rendered under 44). The coarse-pointer hit area doesn't cover inputs or checkboxes, which measure 13–20px. WCAG 2.5.8 itself passes | A11y (internal target) | Agent-reported | B-16 | Primary touch controls ≥ 44×44 per DESIGN.md |
| A002-44 | `env(safe-area-inset-*)` is used in 4 places, but the viewport has no `viewport-fit=cover`, so those values never take effect | Responsive | **Verified live** (lead read the meta) | C §4 | Add `viewport-fit=cover`, and test on a notched device |
| A002-45 | Decorative leftovers: gradients (`TrackingStreak`, `PendingTransactionsBanner`, dark `/archive`, `ProjectedBurnCard`, `SavingsBalanceHistory`), 3 blur uses, 36 Sparkles icons (Audit 001 #12), "Kelola →" | Visual | Agent-reported (code and live) | C-05 | None remain outside the palette swatch |
| A002-46 | Account menu dialog is named "Buka menu" (the opener's label). Add-photo close button is labelled in English ("Close") | Accessibility | Agent-reported | B §3 | Dialog names describe the dialog, in the UI language |
| A002-47 | AI answer counts "sisa 4 hari" while the dashboard says 3, and renders a markdown table as raw pipes | Content | Agent-reported live | D-18, `D-AI03-answer1.png` | AI figures use the dashboard's day count, and tables render |
| A002-48 | Under the WCAG 1.4.12 text-spacing override, truncation increases and one element overflows | Accessibility | Agent-reported | B-11 | No clipped content under the override |
| A002-49 | A Saku created with an opening balance (400.000) shows that balance nowhere when "Pantau Saldo Riil" is off. A savings-type Saku shows a Rp 500.000 spending budget | Content | Agent-reported live | D-17 | The opening balance is shown or not asked for, and stash Saku have no spending budget |
| A002-50 | Subscription notes survive an edit in code, but the form has no notes field, so they can't be seen or edited | UX | **Verified in code** (lead) | `SubscriptionsClient.tsx:83,181,228` | The notes field is shown and editable, and it round-trips live |

### 6.1 Findings by domain and priority

| Domain | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|
| Accessibility | 0 | 1 (05) | 6 (06, 07, 08, 09, 22, 24) | 6 (26, 27, 28, 43, 46, 48) |
| Usability and task completion | 0 | 1 (04) | 6 (10, 11, 13, 14, 15, 16) | 11 (30, 31, 34, 35, 36, 37, 38, 39, 47, 49, 50) |
| Responsive | 0 | 0 | 2 (17, 18) | 2 (33, 44) |
| Visual consistency | 0 | 0 | 1 (19) | 1 (45) |
| Reliability and data integrity | 1 (01) | 2 (02, 03) | 2 (12, 23) | 2 (29, 32) |
| Performance | 0 | 0 | 2 (20, 21) | 3 (40, 41, 42) |
| PWA and offline | 0 | 0 | 0 | 1 (25) |

Total: 1 P0, 4 P1, 19 P2, 26 P3 = **50 findings**.

---

## 7. Screenshots and evidence

| Location | Contents |
|---|---|
| `docs/audits/evidence/002/screenshots/` | 36 selected screenshots, synthetic data only. Prefixes: `lead-` (lead reproductions), `A-`, `B-`, `C-`, `D-` (agents) |
| `docs/audits/evidence/002/agent-reports/` | The four agent reports (A–D) as delivered. Their findings are agent-reported unless this register marks them verified |
| `docs/audits/evidence/002/data/` | `lint.log`, `build.log`, `tsc.log`, Lighthouse summaries (`A-summary-*.json`), bundle (`A-bundle.json`), console (`A-console-*.json`), PWA privacy test (`A-pwa.json`) |
| `docs/audits/evidence/002/scripts/` | Every Playwright, Lighthouse and analysis script, plus `lib.mjs`, `create-accounts.mjs`, `contrast.js`, `audit_inputs.js` and `AGENT_BRIEF.md`. The scripts contain no credentials; those lived only in the session scratchpad |

The other ~330 screenshots and the full Lighthouse JSON reports stayed in the audit session's scratchpad and weren't committed, for size reasons.

---

## 8. Comparison with Audit 001

Legend: **FIXED** · **PARTIAL** (improved, still open) · **STILL PRESENT** · **REGRESSED** (none found) · **NOT REPRODUCED**.

| # | Audit 001 item | Status | Basis |
|---|---|---|---|
| 1 | Overlays aren't real dialogs | PARTIAL | 22 of 24 dialogs pass; AI sheet (A002-06) and QR / delete Escape (A002-08) don't |
| 2 | Labels not connected | PARTIAL | `htmlFor` 2 → 6, `Field.tsx` exists, 69 of 87 still unlabelled (A002-05) |
| 3 | Pinch zoom blocked | FIXED | Viewport is `width=device-width, initial-scale=1` (lead) |
| 4 | No reduced-motion handling | PARTIAL | Global CSS rule; savings confetti respects it; split confetti doesn't (A002-28) |
| 5 | Tap targets under 44px | PARTIAL | `/`, `/savings`, `/saku` have 0 under 44; forms and split editor don't (A002-43) |
| 6 | Contrast failures | PARTIAL | Home, savings and login are clean in every palette; a few remain (A002-27) |
| 7 | Em dash in the UI | FIXED | 0 in code and rendered text |
| 8 | Dark-only skeletons | PARTIAL | Colour fixed in both themes; shape wrong on `/split` and `/saku` (A002-39) |
| 9 | Missing error states | PARTIAL | `error.tsx` and `not-found.tsx` exist, savings reports failures; A002-12, A002-23 remain |
| 10 | Dead and hover-only controls | FIXED | Emoji span, visible 44px delete, split row is a `<button>` |
| 11 | No design direction | FIXED | `docs/design/DESIGN.md` and tokens |
| 12 | Sparkles overuse | STILL PRESENT | 36 uses (A002-45) |
| 13 | Uppercase tracked labels, Geist | FIXED | 0 uppercase; Plus Jakarta Sans |
| 14 | Gradients and glow | PARTIAL | Fewer, but some remain (A002-45) |
| 15 | `backdrop-blur` ×38 | FIXED | 1 left |
| 16 | Vendor capsule badges | FIXED | Only conditional key-settings copy remains |
| 17 | Arrows on buttons | PARTIAL | "Kelola →" on `/split` |
| 18 | Three-card welcome template | FIXED | Full page with a list and two buttons |
| 19 | 14 colour families | PARTIAL | Remapped to tokens; classes still everywhere (A002-19) |
| 20 | Everything pill-shaped | PARTIAL | Cards and controls 12/16px; chips are still full radius |
| 21 | No identity | PARTIAL | Strong on home; other routes drift (A002-19) |
| 22 | Dark default | FIXED | Light default, per-theme `themeColor` |
| 23 | 428 uses of text under 12px | FIXED | 0 in code, 0 rendered |
| 24 | First visit is a modal over nothing | FIXED | Full welcome page, risk copy fully visible (D live) |
| 25 | A stray tap creates a guest | FIXED | 0 auth cookies after every stray interaction (D live) |
| 26 | Search covers today only | PARTIAL | Searches the selected week or month; scope unstated (A002-36) |
| 27 | Misleading compare headline | FIXED | Same-day normalisation (lead read the code); edge cases A002-15, A002-30 |
| 28 | Split charges the host by default | PARTIAL | Manual default fixed; removal and scan still wrong (A002-04) |
| 29 | Editing a subscription erases notes | FIXED (code) | Round-trips in code; not visible in the form (A002-50) |
| 30 | Four features only in the menu | PARTIAL | Patungan is in the nav; Langganan, Arsip and Notifikasi are still menu-only |
| 31 | Saku unreachable | FIXED | Flag on, `/saku` loads |
| 32 | Add modal: three modes, Rp 0 accepted | PARTIAL | Rp 0 rejected; mode tabs still wrap |
| 33 | Raw `type=number` money inputs | PARTIAL | Quick and standard amount fixed; savings, Saku and split not (A002-02) |
| 34 | Raw English auth errors, no password reset | STILL PRESENT | A002-11 |
| 35 | Nav visible behind the welcome screen | FIXED | Bar hidden when signed out |
| 36 | Export shows a phantom budget | PARTIAL | Archive export fixed; dashboard export still shows the default (A002-10) |
| 37 | Clipboard reports false success | FIXED | "Copied" only after success; no failure message (minor) |
| 38 | Mixed languages | STILL PRESENT | A002-31 |
| 39 | AI quoted a different budget | NOT REPRODUCED | Budget matched; day count differed (A002-47) |
| 40 | Dashboard buries the list | FIXED | List in the first screen at 375×812 |
| 41 | Three fixed bottom layers | FIXED | One bar |
| 42 | Five routes to the AI | FIXED | One header entry on home |
| 43 | Savings density, Alirkan/Alokasikan | PARTIAL | Actions renamed, delete visible; figure count not re-measured |
| 44 | Header wraps at 375 | FIXED | Truncates at 320 only (A002-33) |
| 45 | Archive 7,877px expanded | PARTIAL | Only one week expanded by default; unbounded when all are expanded (A002-40) |
| 46 | No offline support | PARTIAL | Offline page and privacy-safe SW; no write queue (A002-25) |
| 47 | Heavy modals ship on every route | FIXED | Add, AI, export and settings are lazy; residual A002-41 |
| 48 | Sequential dashboard round trips | STILL PRESENT | A002-20 |
| 49 | Wrong PWA icons | FIXED | Correct 192/512 sizes plus maskable |
| 50 | Every route server-rendered on demand | STILL PRESENT | All ƒ in `build.log` |
| 51 | Static confetti and qrcode | PARTIAL | Savings lazy; split viewer static (A002-28) |
| 52 | CSS weight | PARTIAL | 164 → 140 KB raw; arbitrary values 473 → 52 |
| 53 | Miscellaneous | PARTIAL | Blur fixed; no iOS install path; dead `GoogleSignInButton`, `AiAdvisorCard` |

**Tally:** 23 FIXED · 24 PARTIAL · 5 STILL PRESENT · 1 NOT REPRODUCED · **0 REGRESSED**.

New findings Audit 001 didn't report include A002-01 (P0, long-standing but never tested), A002-02/-03 (savings integrity), A002-07, -10, -13 to -16, -17, -18 and -21.

**Strengths to keep (all verified working):**
- Quick Add: the preview matches what is saved, 1 request per save.
- Budget pace line: "Aman. Rp X untuk 3 hari lagi".
- Split friend view: reconciles to the rupiah, works without an account and at every viewport.
- Guest-risk copy: fully visible.
- Subscription cards: price, countdown, share.

Newly earned strengths:
- Duplicate-submit and retry protection everywhere tested.
- The shared `Dialog`/`ModalOverlay` behaviour.
- A privacy-safe service worker.
- Zero console errors.
- CLS of 0.

---

## 9. Unverified areas and limitations

### Status counts per domain

| Domain | Criteria | PASS | PARTIAL | FAIL | N/A | UNVERIFIED | Pass rate (PASS ÷ tested) |
|---|---:|---:|---:|---:|---:|---:|---|
| Accessibility (§6.3 + screen reader) | 34 | 8 | 17 | 7 | 0 | 2 | 8 / 32 = 25% (2 unverified) |
| Usability and task completion (§6.2, §6.4, §6.5, journeys A–H) | 54 | 17 | 30 | 7 | 0 | 0 | 17 / 54 = 31% |
| Responsive (checklist) | 12 | 5 | 6 | 0 | 0 | 1 | 5 / 11 = 45% (1 unverified) |
| Visual consistency (§6.1) | 14 | 1 | 10 | 3 | 0 | 0 | 1 / 14 = 7% |
| Reliability and data integrity (§6.6) | 12 | 2 | 8 | 2 | 0 | 0 | 2 / 12 = 17% |
| Performance (§6.7) | 13 | 8 | 4 | 1 | 0 | 0 | 8 / 13 = 62% |
| PWA and offline (§6.8) | 10 | 3 | 4 | 1 | 0 | 2 | 3 / 8 = 38% (2 unverified) |

PARTIAL counts as not passing. Item-level statuses are in the agent reports' checklist sections. Where the lead adjusted an agent's status during consolidation, the stricter status was used.

**Routes and viewports covered:** every route in §4.1, at 8 viewports in light mode and 3 in dark. Dark mode at 430, 768, 1024 and 1440 was not run.

### Not tested, or UNVERIFIED

- **Screen readers.** No NVDA, VoiceOver or TalkBack pass. Accessibility-tree snapshots are supporting evidence only.
- **Real devices.** On-screen keyboard, safe areas, real touch, PWA install and installed-app behaviour were not tested. 375×500 stood in for the keyboard.
- **Field performance.** No CrUX or Vercel Speed Insights data, and no INP. Lighthouse ran with other agents active on the machine.
- **200% browser zoom and text-only enlargement.** Only proxies were used: a 640×400 viewport and the WCAG 1.4.12 override.
- **Push notification delivery.** Headless Chromium denied push registration.
- **Photo extraction "Terapkan" step.** The single authorised upload was spent on extraction, which was correct.
- **Subscription notes in the live UI.** The form has no notes field, so this was checked in code only.
- **Failed server fetch rendered live.** Code only; RSC abort fell back to a full page load.
- **Service-worker update across versions, and session-expiry behaviour.**
- **Other RLS policies were not probed anonymously.** All non-split tables are owner-only in `pg_policies`.

### Anomaly not resolved

The `journey` account's AI counter read 5/20 when Agent D first opened the sheet, before D's own 2 prompts. The source of those 5 uses wasn't identified; they may be earlier aborted calls from D's own scripts. It doesn't affect any finding.

### Process notes

- Saved Playwright login states went stale mid-run, likely through refresh-token rotation shared across parallel contexts. Agent C discarded the affected results and re-ran them.
- The lead withdrew one of its own observations (login labels) after it failed to reproduce.

---

## 10. Prioritised remediation plan

This is a handoff, not part of the audit. Each workstream is a candidate PR. The acceptance criteria are the ones in the findings above.

| Order | Workstream | Findings | Depends on | Risk / notes |
|---|---|---|---|---|
| **0, now** | **Lock down split-bill data.** Drop the three `Public read` policies. Serve the friend view through a `SECURITY DEFINER` RPC (or a server-side query) that returns one bill by ID or share token. Decide whether `payment_info` belongs in the friend view. Review whether the existing exposure needs disclosure | A002-01, A002-29 | none | Must ship with friend-view tests (signed out, by ID), or the core sharing strength breaks |
| 1 | **Money input and savings integrity.** One `MoneyField` for every amount. Server-side balance check on withdrawals. Explicit decimal and negative handling | A002-02, -03, -13 | none | Data already stored with tiny targets or negative balances may need a one-off review |
| 2 | **Explicit split allocation.** An "unassigned" state, publish blocked until resolved, scan default consistent with manual, itemised rounding line | A002-04, -35 | 0 (same feature) | Touches `splitCalculator.ts`; add unit tests for allocation and rounding |
| 3 | **Forms and dialogs on shared primitives.** Migrate to `Field`/`Dialog`, `aria-invalid`, named icon buttons, AI sheet onto `Dialog`, Escape without the icon-class dependency, `scroll-padding-bottom`, programmatic selected states, border contrast | A002-05, -06, -07, -08, -09, -22, -24, -26, -27, -43, -46, -48 | 1 (money fields) | Biggest workstream; do it screen by screen with axe at 0 as the gate |
| 4 | **Honest financial copy.** No phantom budget, correct export average and label, consistent compare basis, real surplus basis, no-baseline wording, one daily figure | A002-10, -14, -15, -16, -30, -37, -49 | none | Pure logic and copy; unit-test `utils/budget.ts` and the compare maths |
| 5 | **Errors and language.** Indonesian error mapping, announced auth errors, password reset, show-password toggle, error states distinct from empty, no native dialogs, one date helper, dictionary completeness | A002-11, -12, -23, -31, -32, -36, -38, -39, -47, -50 | 3 (dialog for confirms) | Password reset needs Supabase email templates |
| 6 | **Performance.** Single auth call, parallel queries, bounded streak, lazy `UpgradeAccountModal`/QR/confetti, investigate LCP render delay, archive pagination, lint in CI | A002-20, -21, -28, -40, -41, -42 | none | Measure before and after with `PERFORMANCE_BUDGET.md`; collect field data |
| 7 | **Design-system convergence.** Tokens only, radii, no card shadows, one toast, remove gradients, blur and Sparkles | A002-19, -45 | 3 | Mostly mechanical; verify contrast in all 5 palettes afterwards |
| 8 | **Responsive and PWA polish.** 320px overflows, split item inputs, `viewport-fit=cover`, SW registration without Push, offline save messaging | A002-17, -18, -25, -33, -34, -44 | 3 | Needs a real-device check |

**After remediation:** schedule Audit 003 as a regression audit, reusing `docs/quality/TESTING_PROTOCOL.md` and the scripts in `evidence/002/scripts/`. Add the manual checks this audit couldn't cover: a screen reader, a real phone, and field CWV.
