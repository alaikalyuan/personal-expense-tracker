# SakuTrack remediation plan for Audit 002

| | |
|---|---|
| Source | `docs/audits/002-redesign-audit.md` (verdict **BLOCKED**: 1 P0, 4 P1, 19 P2, 26 P3), and the open items carried over from `001-initial-audit.md` |
| Date | 2026-11-13 |
| Goal | Reach **CONDITIONALLY READY**: no open P0 or P1, and every P2 either fixed or written down with a reason. Then run Audit 003 as a regression audit |
| Rule | The audit reports stay unchanged. Progress is tracked here, in the status column of each workstream |

This plan builds on the remediation table in Audit 002 §10. It keeps that order, checks it against the code, assigns every finding to a workstream, and marks what needs a decision or an action from the owner.

---

## 1. Ground rules for every PR

1. **One workstream per branch and PR.** Branches start from `master`, named `fix/a002-<workstream>`.
2. **The finding's acceptance criteria are the definition of done.** Each PR description lists the finding IDs it closes and how each criterion was checked.
3. **Re-run the audit's own checks.** The Playwright and axe scripts in `docs/audits/evidence/002/scripts/` are reused, pointed at a production build (`next build && next start -p 3100`).
4. **Gates on every PR:** `npx tsc --noEmit` exit 0, `npm run build` exit 0, and no new lint errors. From WS6 onward, `npm run lint` must exit 0.
5. **Add unit tests where the maths lives.** There is no test runner yet, so WS1 adds Vitest as a dev dependency, with tests for money parsing, `utils/splitCalculator.ts` and `utils/budget.ts`.
6. **Never touch the live database without the owner's yes.** There is no local Supabase, so a migration is applied to the live project. The migration is written and reviewed first, and applied only after the owner says so.

---

## 2. Owner decisions needed

These block or shape specific workstreams. Everything else can go ahead without them.

| # | Decision | Blocks | Suggested default |
|---|---|---|---|
| D1 | Apply the WS0 migration to the live Supabase project | Closing A002-01 | Apply it as soon as the friend-view RPC is tested |
| D2 | Should account numbers (`payment_info`) appear in the friend view at all? | WS0 scope | Keep them, but only for the bill being viewed (already the case once enumeration is closed) |
| D3 | Disclose the exposure to the 2 real users whose 5 bills were listable? | Nothing in code | The owner's call. It's a small personal project, but bank account numbers were exposed |
| D4 | Review the data already stored: goals saved with tiny targets (A002-02), and negative savings balances (A002-03) | WS1 follow-up | A read-only query lists candidates; the owner decides on each one |
| D5 | Password reset: set up the Supabase reset-email template and redirect URL in the dashboard | Part of WS5 (A002-11) | The code goes in WS5; the dashboard setting is done by the owner |
| D6 | Unknown day count for the AI (A002-47): which "sisa hari" counts as correct, the dashboard's or the AI snapshot's? | WS4 | The dashboard's |

---

## 3. Workstreams

Status values: `TODO`, `IN PROGRESS`, `IN REVIEW`, `DONE` (merged and checked against the acceptance criteria).

### WS0: Close the split-bill data exposure (P0)

- **Findings:** A002-01 (P0), A002-29 (P3)
- **Depends on:** nothing. **Do first.**
- **Status:** DONE (2026-11-13). PR #9 merged as `6cd8fb3` and deployed to production. Both migrations applied live: `20261113082149_add_get_shared_split_bill` before the deploy, `20261113082816_drop_public_split_read` after it. Anonymous counts on all three tables are 0; the production friend view still loads bills signed out. Not yet checked live: the creator's own view and the non-creator toggle rejection. Owner decision D3 (disclosure) is still open

What changes:
1. A new migration `supabase/migrations/2026111x_lock_split_bills.sql`:
   - Drop the `Public read split_bills / split_participants / split_items` policies.
   - Add `public.get_shared_split_bill(p_bill_id uuid) returns jsonb`, `SECURITY DEFINER`, `SET search_path = ''`. It returns one bill with its participants and items, or null. `EXECUTE` is granted to `anon` and `authenticated`. Bill IDs are `gen_random_uuid()`, so knowing one ID never leads to another bill.
   - Mirror the same change in `supabase/schema.sql:301-317`.
2. `app/split/[id]/page.tsx` loads through `supabase.rpc('get_shared_split_bill', …)` instead of three table reads. A null result calls `notFound()`. This does not fix the 200 status in A002-32: the not-found page is streamed after `loading.tsx` has already sent a 200, so that stays in WS5.
3. The creator's own pages (`/split`, `/split/[id]/edit`, `utils/ai/snapshot.ts`) already read through the `Creator manage` policies, so they keep working. Each is checked after the change.
4. `toggleParticipantPaid` (`app/split/actions.ts:228`) checks that the user created the bill and returns an explicit error otherwise (A002-29).

Checks:
- An anonymous `HEAD /rest/v1/split_bills?select=id` with `Prefer: count=exact` returns `*/0`. The same goes for participants and items (re-run `agent-A-authz.mjs`).
- The friend view loads signed out, as a guest, and signed in as a non-creator. The totals still reconcile (37.950 / 49.450 / 12.650 on the `typical` bill).
- The creator's list, edit page and AI snapshot still show their bills.

Risk: if the RPC ships before the friend view is switched over (or the reverse), shared links break. The page change and the migration go out together, and the migration is applied right before the deploy.

### WS1: Money input and savings integrity (P1)

- **Findings:** A002-02, A002-03, A002-13 (and the Audit 001 #33 carry-over)
- **Depends on:** nothing
- **Status:** DONE (2026-11-14). PR #12 merged as `9f58bd6`. Not checked in a signed-in browser. Known gaps: balance checks read then write (a race could pass two withdrawals; needs a DB constraint or RPC), the withdrawal cap is the total stash rather than the unallocated part, and the sweep action does not check the surplus on the server

What changes:
1. `MoneyField` in `app/ui/Field.tsx` already exists (used by `BudgetEditDialog`, `ExpenseList`). Pull its parsing into `utils/money.ts` (`parseRupiahInput`) with clear rules: `2.000.000` → 2000000; `15.000,50` → rejected with a message (rupiah has no decimals in practice); a negative or non-numeric value → rejected.
2. Replace every `type="number"` money input with `MoneyField`: `app/savings/SavingsClient.tsx` (5), the Saku dialogs, the subscription dialogs, and the standard amount in `app/QuickAddExpense.tsx:1143`. The six in `SplitBillCreator.tsx` are left to WS2, so the two branches don't touch the same file.
3. `adjustSavingsBalance` (`app/actions.ts:~1026`) reads the stash balance on the server and rejects a withdrawal above it, with an Indonesian message. The withdraw dialog shows the available balance and blocks larger amounts.
4. Add Vitest and tests for `parseRupiahInput`.

Checks: typing `2.000.000` stores 2000000 in every money field; a withdrawal above the balance is refused by the server even when the UI check is skipped; no savings action can push the balance below 0.

### WS2: Explicit split allocation (P1)

- **Findings:** A002-04, A002-35, A002-18 (the item inputs are in the same component)
- **Depends on:** WS0 (same feature, merge WS0 first)
- **Status:** IN REVIEW (2026-11-14). Branch `fix/a002-ws2-split-allocation`. The creator page is untested in a browser (it needs a registered account)

What changes:
1. `handleRemoveParticipant` (`SplitBillCreator.tsx:469-480`): when the removed person was an item's only assignee, the item becomes "Belum dibagi" and is highlighted, instead of spreading to everyone.
2. Scanned items (`:251`, `:267`) use the same default as manual items: everyone.
3. `utils/splitCalculator.ts:146-148` no longer splits an empty assignment. It reports the item as unassigned, and publishing is blocked while any item is unassigned.
4. A "Pembulatan" line in the creator summary and the friend view, so every breakdown adds up (A002-35).
5. Split money inputs move to `MoneyField`, and the item row is laid out so an 8-digit price fits at 320px and 375px (A002-18).
6. Unit tests for allocation, removal and rounding.

Checks: the Journey E steps from the audit (assign "Ayam bakar" to Rina, remove Rina) leave the item unassigned and publishing blocked; rounding lines reconcile to the rupiah.

### WS3: Forms and dialogs on the shared primitives (P1 + P2 accessibility)

- **Findings:** A002-05 (P1), A002-06, -07, -08, -09, -22, -24 (P2), A002-26, -27, -43, -46, -48 (P3)
- **Depends on:** WS1 and WS2 merged, because they touch the same forms
- **Status:** TODO

The biggest workstream. It goes **screen by screen**, with axe `label`, `select-name` and `button-name` at 0 as the gate for each screen.

1. **Primitives first** (one small PR):
   - `ModalOverlay`: Escape calls an `onClose` prop instead of clicking a button with `svg.lucide-x` (A002-08).
   - `Dialog` requires an accessible title and a labelled close button (A002-09, -46).
   - Global `scroll-padding-bottom` set to the bottom-bar height (A002-07).
   - Field border token reaches 3:1 against its surface (A002-22).
   - A `ToggleChip` / segmented control with `aria-pressed` and a non-colour selected mark (A002-24).
2. **Then each surface:** add expense (standard form, quick-mode checkbox, mode buttons), savings dialogs, Saku dialogs, subscription add and edit, notifications, `/split/new`, `/split/[id]/edit`, then the AI sheet moved onto `Dialog` (A002-06).
3. **Page structure:** a unique `<title>` per route, `<main>` on `/saku`, `/saku/[id]`, `/subscriptions`, heading order (A002-26); the remaining contrast failures (A002-27); 44px targets on forms and the split editor (A002-43); text-spacing override (A002-48).

Checks: re-run `agent-B-axe-routes.mjs` and `agent-B-dialogs*.mjs`, with 0 `label`, `select-name`, `button-name` violations; 0 of 30 Tab presses leave the AI sheet; Escape closes the QR and delete dialogs.

### WS4: Honest financial copy and maths (P2)

- **Findings:** A002-10, -14, -15, -16, -30, -37, -47, -49
- **Depends on:** nothing (pure logic and copy)
- **Status:** DONE (2026-11-14). PR #10 merged as `c7d24d7`. Not checked in a signed-in browser. Left as found: the AI snapshot's week total ignores days that fall in the previous month and isn't filtered by the selected Saku

1. Remove the Rp 500.000 fallback (`utils/budget.ts:51,74`, `utils/wallets/server.ts:273`). With no budget set, the dashboard shows an "Atur budget" state and exports omit the budget (A002-10, and A002-49 for stash Saku).
2. Export average divides by the days elapsed in the period; the monthly recap is labelled "Bulan" (A002-14, `ExportShareModal.tsx:117`).
3. The compare pace card uses the same day window as the headline (A002-15, `compare/page.tsx:144-145`). With no baseline, show the amount only (A002-30).
4. The surplus counts only weeks since the account (or budget) started and says how it's computed (A002-16).
5. One daily figure per monthly view, positive wording for money saved (A002-37).
6. The AI snapshot uses the dashboard's day count, and markdown tables render (A002-47, `remark-gfm` is already a dependency).
7. A Saku's opening balance is shown, or not asked for (A002-49).

Checks: unit tests on `utils/budget.ts` and the compare maths; a fresh account shows no allowance until a budget is set.

### WS5: Errors, recovery and language (P2)

- **Findings:** A002-11, -12, -23 (P2), A002-31, -32, -34, -36, -38, -39, -50 (P3)
- **Depends on:** WS3 (confirmations use the app dialog)
- **Status:** TODO

1. `utils/errors.ts` maps Supabase and network errors to Indonesian messages with a next step. Server actions stop passing `error.message` through (`app/actions.ts:46,108,166,195,254`).
2. Auth: error in `role="alert"` tied to the field with `aria-invalid`, a show-password toggle, a "Lupa password?" flow (needs owner decision D5).
3. Server pages check `error` on their queries and render an error state with a retry, distinct from empty (A002-12).
4. Every mutation shows an in-app error on failure; the 19 native `alert`/`confirm` calls move to the app dialog and toast (A002-23).
5. One date helper, the remaining English strings, "Anda" → "kamu" (A002-31).
6. Unknown `/saku/<id>` returns 404 (A002-32; split is covered in WS0).
7. Warn before discarding a typed expense (A002-34); search states its scope and links to Archive; Archive copy (A002-36); guest sign-out and an explanation on restricted routes (A002-38); route-shaped skeletons and next steps in empty states (A002-39); a visible notes field on subscriptions (A002-50).

### WS6: Performance and engineering hygiene (P2)

- **Findings:** A002-20, -21 (P2), A002-28, -40, -41, -42 (P3)
- **Depends on:** nothing
- **Status:** DONE except A002-21 (2026-11-14). PR #11 merged as `67e35d3`. Signed-out `/` first-load JS −68.8 KB gzip. CI runs tsc, lint, tests and build on every PR. A002-21 (LCP) still needs a performance trace. Trade-off: the dashboard verifies the JWT locally, so a session revoked elsewhere stays valid there for up to an hour

1. Dashboard server work (`app/page.tsx`): one `auth.getUser` per request (pass the user into `processSubscriptionRenewals`), wallet balances read once, a bounded streak query, independent queries in one `Promise.all`, and renewal writes moved out of render.
2. Lazy-load `UpgradeAccountModal`, QR and confetti; confetti respects reduced motion (A002-28, -41).
3. Archive weeks show a capped number of entries with "Tampilkan lagi" (A002-40).
4. Investigate the LCP render delay (A002-21) with a trace, then fix what the trace shows. No guessing.
5. Fix the 13 lint errors, and add a GitHub Actions workflow running `tsc`, `lint`, `build` and the unit tests on each PR (A002-42).

Checks: measure before and after with the Lighthouse script (`agent-A-lh.mjs`) against `docs/quality/PERFORMANCE_BUDGET.md`.

### WS7: Design-system convergence (P2 visual)

- **Findings:** A002-19, A002-45
- **Depends on:** WS3 (the same files get rewritten there)
- **Status:** TODO

Mechanical, but large: 4,326 legacy colour classes, 209 shadows, 7 toasts, 283 raw `<button>`s. It goes route by route: `/saku`, `/subscriptions`, `/split`, then the rest. Each route: token classes only, radius 12/16/full, no card shadows, the shared `Button` and one toast; gradients, blur and extra Sparkles removed. Contrast is checked in all five palettes after each route (`agent-C-06-shadow-palette.mjs`).

### WS8: Responsive and PWA polish (P2/P3)

- **Findings:** A002-17 (P2), A002-25, -33, -44 (P3)
- **Depends on:** WS3
- **Status:** TODO

1. Subscription card actions wrap at 320px (A002-17); the 320px overflows in A002-33.
2. `viewport-fit=cover` in the viewport export (A002-44).
3. The service worker registers wherever service workers exist, not only where Push does; an offline save shows a plain Indonesian "belum tersimpan" message (A002-25).

Needs a real phone for the safe-area and install checks.

---

## 4. Order and parallel lanes

```
WS0 (P0) ─┬─> WS2 (split) ──┐
          │                 ├─> WS3 (forms & dialogs) ─┬─> WS5 (errors & language)
WS1 ──────┘─────────────────┘                          ├─> WS7 (design system)
WS4 (copy & maths) ── independent                      └─> WS8 (responsive & PWA)
WS6 (performance)  ── independent
```

- **Lane 1, now:** WS0, then WS2.
- **Lanes 2 to 4, at the same time as lane 1:** WS1, WS4, WS6. Their files don't overlap: WS1 owns the non-split money inputs and `app/actions.ts`; WS4 owns `utils/budget.ts`, `compare/`, `ExportShareModal`; WS6 owns `app/page.tsx` data loading, `proxy.ts`, archive pagination and lint fixes. The one shared file is `app/page.tsx` (WS4 copy, WS6 data loading), so WS4 merges first and WS6 rebases.
- **After those merge:** WS3, split by surface. Then WS5, WS7, WS8, which can run together if WS7 takes routes the others aren't touching.

---

## 5. Exit criteria and Audit 003

- Every P0 and P1 acceptance criterion is ticked, with the check named in the PR.
- P2s are fixed, or listed here with the reason they're deferred.
- Audit 003 reuses `docs/quality/TESTING_PROTOCOL.md` and `evidence/002/scripts/`, and adds what Audit 002 couldn't cover: a screen-reader pass (NVDA or TalkBack), one real Android phone, and field Core Web Vitals once there is traffic data.
