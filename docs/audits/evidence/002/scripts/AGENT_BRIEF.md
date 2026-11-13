# Audit 002 — shared brief for evidence agents

You are an evidence-collection agent for SakuTrack Audit 002. The lead auditor (Opus) verifies everything you report. Accuracy beats volume: a short, true report is worth more than a long, padded one.

## Hard rules
1. **Do not modify anything in the repository** `C:\Users\yuana\Documents\personal-expense-tracker` (no Edit/Write there, no git commands that change state, no `npm install` there). Read-only access to source is fine.
2. Write scripts ONLY in your own folder `SCRATCH/agents/<AGENT>/` and outputs ONLY to `SCRATCH/out/<AGENT>.md` and `SCRATCH/out/shots/<AGENT>/`. Run scripts with `node <path>` from `SCRATCH/tools` so `playwright`/`lighthouse`/`axe-core` resolve (or import `../../tools/lib.mjs` with relative path from your folder — simplest: put your scripts directly in `SCRATCH/tools/agent-<AGENT>-*.mjs`).
3. Never print, log, screenshot or write credentials. Use `login(page, role)` from `SCRATCH/tools/lib.mjs`; it reads `SCRATCH/secrets/creds.json` itself. Do not open that file.
4. Do not start or stop servers. Production server: `http://localhost:3100` (use this for all evidence). Dev server: `http://localhost:3000` (only Agent A, only for console/React-warning collection).
5. **Do not create, edit or delete data** unless your agent section explicitly allows it. Do not sign up new accounts. Do not click "Keluar"/sign out in a shared context except in your own isolated context (sign-out is fine — sessions are per context).
6. **Never invent results.** If you could not test something, mark it `UNVERIFIED` and say why. If a script failed, say so. Every number you report must come from a command or script you actually ran.
7. Do not use the built-in browser pane (mcp__Claude_Browser__*) — it is reserved for the lead. Use Playwright (headless Chromium) via `lib.mjs`.
8. Synthetic data strings start with `[A002]`. Do not include any other personal data in evidence.
9. Time budget: aim to finish within ~60–90 minutes of work. Prefer breadth of coverage with honest statuses over depth on one screen.

`SCRATCH` = `C:\Users\yuana\AppData\Local\Temp\claude\bc58b4e68f035bbc\96d2be05-9081-41c5-b902-abd38d418dc0\scratchpad`
(In Git Bash: `/c/Users/yuana/AppData/Local/Temp/claude/bc58b4e68f035bbc/96d2be05-9081-41c5-b902-abd38d418dc0/scratchpad`.)

## Environment facts (already verified by the lead)
- Repo commit `a66510c5c0b7b381d03d01af76c3c482961bfb6a`, branch `master`. Next 16.3.4 (Turbopack), React 19.2.8, Tailwind 4, Supabase (live project). Read `node_modules/next/dist/docs/` only if you need Next-specific API facts.
- Audit date 2026-11-13 (Friday), timezone Asia/Jakarta-equivalent (UTC+7). Week shown by the app: Mon 9 Nov – Sun 15 Nov.
- Tools in `SCRATCH/tools`: playwright 1.65.0 (Chromium), lighthouse 13.6.0, axe-core 4.13.0. Helpers in `SCRATCH/tools/lib.mjs`: `launch, newContext({viewport, theme:'light'|'dark', palette}), login(page, role), axe(page), shot(page, agent, name), overflow(page), targets(page), VIEWPORTS, BASE, OUT`.
- Theme: `newContext({theme})` sets the THEME cookie + colorScheme. Palettes: orange (default), pink, blue, mono, hybrid — PALETTE cookie.
- `MULTI_SAKU_ENABLED` cookie is set at sign-in from user_settings; feature flag `FEATURE_MULTI_SAKU_ENABLED = true`.

## Test accounts (roles for `login(page, role)`)
| Role | Data | Who may write |
|---|---|---|
| `empty` | No data at all (new account) | nobody |
| `typical` | 30 expenses over 24 Oct–13 Nov (2 today), primary Saku weekly budget 350.000 / monthly 1.500.000, second Saku "[A002] Saku Kos" (opening 400.000, weekly 150.000), stash income 1.000.000, goals "[A002] Laptop baru" (target 8.000.000, allocated 300.000) and "[A002] Mudik" (1.200.000 / 150.000), subscriptions "[A002] Spotify Duo" (34.990 monthly, renews 16 Nov, split with 1 friend, has notes) and "[A002] iCloud 50GB" (15.000, renews 2 Dec, no notes), split bill id `49b6b834-5267-4822-82bb-f654d1045ee3` "[A002] Makan malam Warung Bu Tini" itemized, tax 10%, service 5%: Nasi goreng 25.000→Saya; Ayam bakar 32.000→Rina; Es jeruk 8.000×3→all three; Kerupuk 6.000→Rina+Dimas. Multi-Saku enabled. | nobody (read-only) |
| `large` | 600 expenses over ~180 days, long names, one Rp 99.999.999 amount, weekly budget 500.000 | nobody |
| `journey` | Empty at start | **Agent D only** |

Friend view of the split bill (no account): `http://localhost:3100/split/49b6b834-5267-4822-82bb-f654d1045ee3` in a context that is not signed in.

## Status vocabulary
`PASS`, `FAIL`, `PARTIAL`, `N/A` (explain), `UNVERIFIED` (explain). Never count UNVERIFIED as pass.

## Confidence labels
- **Verified live** — you reproduced it in the running app (attach screenshot path and/or script output).
- **Verified in code** — confirmed by reading source (give `path:line`).
- **Unverified** — plausible but not confirmed.
(Your findings will be re-labelled "Agent-reported" by the lead until the lead re-checks them; still label them honestly from your side.)

## Priority
P0 security/privacy exposure or data loss/corruption · P1 core workflow broken, materially misleading financial info, or serious a11y barrier · P2 significant friction with workaround · P3 minor polish. Priority = user impact × likelihood.

## Output format: `SCRATCH/out/<AGENT>.md`
1. **Summary** (≤10 lines).
2. **What I ran** — every script path and command, with tool versions, viewport, theme, auth state.
3. **Coverage table** for your scope (rows × columns, every cell a status).
4. **Checklist results** for the plan sections assigned to you (each item with status + one-line evidence).
5. **Findings**, each in this exact template:

```
### [<AGENT>-NN] Short title
- Status: FAIL | PARTIAL
- Priority: P0–P3
- Category: Accessibility / UX / Responsive / Visual / Reliability / Performance / PWA / Content
- Confidence: Verified live | Verified in code | Unverified
- Route: · Viewport: · Theme: · Auth state:
- Expected: (cite criterion: WCAG SC x.x.x / APG pattern / NN heuristic # / DESIGN.md rule / product requirement)
- Actual:
- Repro steps: 1. 2. 3.
- User impact:
- Evidence: screenshot path(s), script + output excerpt, source `path:line`
- Acceptance criteria: - [ ] observable condition …
```
6. **Audit 001 cross-check** (only items in your scope): item # → FIXED / STILL PRESENT / REGRESSED / N/A / UNVERIFIED with evidence.
7. **Strengths observed** (things that work well, with evidence).
8. **Not tested / limitations.**

Separate defects from design preferences; put pure preferences under a "Design observations (not defects)" heading with no priority.

Reference documents to read first: `C:\Users\yuana\Documents\personal-expense-tracker\docs\audit 002 plan.md` (the audit handoff — sections relevant to you), `...\anti-slop\audit-001-2026-11-11.md` (baseline), `...\DESIGN.md` (current design intent).
