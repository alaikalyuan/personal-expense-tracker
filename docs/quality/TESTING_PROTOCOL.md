# Testing protocol for SakuTrack quality audits

This is how Audit 002 was run, written so the regression audit can repeat it exactly. Standards, statuses and priorities are defined in `AUDIT_STANDARDS.md`.

## 1. Ground rules

- **Audit only.** While collecting evidence, do not change application code, styles, configuration, feature flags or schema. Fixes go in a separate remediation phase and get re-tested afterwards. The only local tooling change Audit 002 made was a `prod` entry in `.claude/launch.json`.
- **There is no local database.** `.env.local` points at the live Supabase project, so every live test writes to production. You need the owner's approval before you create accounts or data. Use dedicated `audit00N-*@sakutrack.test` accounts and prefix every synthetic string with `[A00N]`. Delete it all at the end, after the owner confirms the list.
- Credentials are generated at random and kept only in the session scratchpad (`secrets/creds.json`). They never go into the repo, chat, screenshots or reports.
- Evidence uses synthetic data only. Never capture real users' data. Security checks run against counts, not contents.
- Never invent a result. Anything not tested is `UNVERIFIED`.

## 2. Environment record (fill in for every audit)

| Item | Audit 002 value |
|---|---|
| Commit / branch | `a66510c5c0b7b381d03d01af76c3c482961bfb6a` / `master` |
| Build | `npm run build`: exit 0 (Next 16.3.4, Turbopack). `npx tsc --noEmit`: exit 0. `npm run lint`: exit 1 (13 errors, 27 warnings) |
| Server | `next start -p 3100` (production) for all evidence. `next dev` on :3000 only for collecting React warnings |
| Browser | Playwright 1.65.0 headless Chromium (HeadlessChrome 158.0.8127.18) |
| Tools | axe-core 4.13.0, Lighthouse 13.6.0, Node 24.12.0 |
| OS | Windows 11 Home (NT 10.0.26200) |
| Date / timezone | 2026-11-13, SE Asia Standard Time (UTC+7) |
| Screen reader | none available, so marked UNVERIFIED |
| Real devices | none, so marked UNVERIFIED |

## 3. Tool setup (outside the repo)

```bash
mkdir tools && cd tools && npm init -y
npm i playwright lighthouse axe-core@4.13.0
npx playwright install chromium
```

Copy `docs/audits/evidence/002/scripts/*.mjs` into that `tools/` folder. `lib.mjs` expects `../secrets/creds.json` and `../out/` next to `tools/`. Its helpers are `launch`, `newContext({viewport, theme, palette})`, `login(page, role)`, `axe(page)`, `shot()`, `overflow(page)`, `targets(page)` and `VIEWPORTS`. `create-accounts.mjs` signs up the four test accounts through the app's own dialog.

## 4. Accounts and data

| Role | Purpose | Data |
|---|---|---|
| `empty` | Empty states | none |
| `typical` | Accessibility and visual passes (read-only) | 30 expenses over 3 weeks, a 350k weekly / 1.5M monthly budget, a second Saku, savings income, 2 goals, 2 subscriptions (one with notes), 1 itemised split bill with tax and service |
| `large` | Large-data and performance passes | 600 expenses over ~180 days, long names, one Rp 99.999.999 amount |
| `journey` | End-to-end journeys (the only account agents may write to) | starts empty |
| guest | Journey A | one anonymous session created through the guest button |

Bulk rows are seeded with SQL, scoped to the test user IDs, and mirror the app's own write paths (goal allocation, for example, writes a `goal_allocate` ledger row). Wallets come from the expense insert trigger.

## 5. Coverage matrix

- **Routes:** `/` (signed out, signed in, guest), `/?auth=login`, `/savings`, `/saku`, `/saku/[id]`, `/subscriptions`, `/split`, `/split/new`, `/split/[id]` (signed in, plus the signed-out friend view), `/split/[id]/edit`, `/compare`, `/archive`, 404, and unknown IDs.
- **Dialogs:** account menu, add expense (quick, standard, photo), edit expense, budget, AI sheet, export, streak, notifications, email sync, savings (goal, allocate, withdraw, move, balance), Saku (create, transfer, income), subscription add and edit, split QR, split delete, login and sign-up.
- **Viewports:** see `RESPONSIVE_CHECKLIST.md`. Light mode at every size; dark at a minimum of 320, 375 and 1280.
- **Palettes:** orange, pink, blue, mono, hybrid on `/`.
- **Network:** normal, Playwright `setOffline`, aborted server action (`page.route` matching the `next-action` header), and a delayed route for the duplicate-submit test.

## 6. Procedure

1. **Phase 0:** record the environment, install the tools, build, start the production server, create and seed the accounts.
2. **Phase 1:** run evidence agents in parallel, each in its own browser context:
   - A: engineering, performance, PWA, Audit N-1 code re-check
   - B: accessibility
   - C: responsive, visual and content
   - D: journeys and data integrity

   Every agent reads `scripts/AGENT_BRIEF.md` and writes a report in the shared finding template.
3. **Phase 2:** the lead reproduces every P0 and P1 personally, spot-checks P2s, reviews screenshots and drops anything that doesn't reproduce. The lead also inspects the live RLS policies, which are not in the repo.
4. **Phase 3:** write the reports. Audit reports never change after publication; fixes are tracked separately.
5. **Phase 4:** clean up. List every test user and row count, get the owner's confirmation, delete, then run a count query that shows zero rows.

## 7. Required manual checks that automation doesn't cover

- A screen-reader pass (NVDA + Chrome or VoiceOver + Safari): add an expense, read the budget, open and close a dialog.
- A real phone: on-screen keyboard with the add form, safe areas, pinch zoom, PWA install and offline.
- Browser zoom at 200% and real text enlargement.
- Field Core Web Vitals (Vercel Speed Insights or CrUX).
- A Supabase RLS review on the live project (`pg_policies`), plus anonymous REST probes that request counts only (`Prefer: count=exact`, `Range: 0-0`).
