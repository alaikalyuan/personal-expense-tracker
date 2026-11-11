# SakuTrack design audit 001 (2026-11-11)

Scope: every route and modal, at 375x812, dark and light, signed in, signed out. Branch `fix/email-sync-verification-detection`. No code was changed.

Method: eight Haiku subagents audited one area each (seven with a live browser pass, one code-only for PWA and performance). I then re-checked every HIGH item below in the code or the browser. Each finding carries a status:

- **V** = verified by me (code read, repo-wide search, or live in the browser)
- **A** = reported by an agent with file and line evidence, not re-checked by me

Priority follows the antislop tiers: Hard Gate = HIGH, Purpose-Gate = MEDIUM, Quality Locks = LOW. UX, clutter, pain point and performance findings are ranked by impact on a student.

## Verdict

**The design does not pass antislop.**

| Block | Result | Why |
|---|---|---|
| Hard Gate | FAIL | R-02, R-03, R-25, R-26, R-27, R-32, R-34, R-37, R-39 each fail at least once |
| Purpose-Gate | FAIL | R-01, R-04, R-06, R-08, R-09, R-10 appear as defaults with no stated purpose |
| Liveliness | FAIL | No dials, no Design Read, no focal point per screen, about 14 accent hues instead of one |
| Craftsmanship and Quality Locks | FAIL | R-11, R-20, R-29, R-31; no `DESIGN.md` and no written reason for any visual choice |

The app is not really black and white. It is a zinc grey base (the sterile default) with 14 Tailwind color families layered on top, each feature picking its own. That is why it reads as both boring and cluttered at once.

What already works and should survive a redesign:
- Quick add: tap Tambah, type `Rp 15.000 lunch`, see a parsed preview, save. Two taps.
- The pace line on the budget card: `Rp 290.000 sisa`, `~Rp 58.000/hari (sisa 5 hari)`.
- The split bill friend view works without an account and its numbers reconcile.
- Honest, specific guest-mode risk copy.
- Subscription cards (price, renewal countdown, my share).

---

## A. Antislop Hard Gate (HIGH)

1. **R-32, R-39: 19 of 21 overlays are not real dialogs. [V]** A search of `app/` finds an Escape handler in only 5 files and `role="dialog"` in only 4, against 21 files that render a `fixed inset-0` overlay. Only `ai/AiAssistantSheet.tsx` and `email-sync/EmailSyncSettingsModal.tsx` close on Escape. Agents confirmed live that Escape does nothing in the add expense, edit expense, budget, login, export, savings goal, allocate, subscription and QR modals, and that Tab walks out of the add modal into the dashboard behind it. No modal moves or traps focus.
2. **R-39: form labels are not connected to their fields. [V]** `app/` has 58 `<label>` elements and 2 `htmlFor`. Fields are announced by placeholder only (`nama@email.com`, `86900`). Several fields have no visible label at all: amount and name in `QuickAddExpense.tsx:1128,1232`, budget in `BudgetProgress.tsx:433`, search in `ExpenseList.tsx:370`.
3. **R-39: pinch zoom is blocked. [V]** `app/layout.tsx:41` sets `maximumScale: 1`. The stated reason (stop iOS input zoom) is better solved by making inputs 16px.
4. **R-39: no reduced-motion handling anywhere. [V]** Zero matches for `prefers-reduced-motion`, `motion-reduce` or `motion-safe` in `app/` and `utils/`. Affected: modal animations in `globals.css`, `animate-ping` and `animate-pulse` in `TrackingStreak.tsx`, confetti in `SavingsClient.tsx` and `SplitBillViewer.tsx`.
5. **R-03: tap targets under 44px are the norm. [V for nav, Add and auth; A for the rest]** Measured: bottom nav links 32px, Add button 38px, login Batal and Masuk 40px, mode tabs 28px, modal close 24x24. Agents measured: weekly/monthly toggle 28px, breakdown tabs 24px, `Reset filter` 17px, language and theme switches 17px, goal edit and delete 22x22, split bill expand control 16x16, checkboxes 15px.
6. **R-25: contrast failures. [V for light-mode remainder; A for the rest]**
   - `BudgetProgress.tsx:131` `text-emerald-400` on white in light mode (the `Rp ... sisa` line): about 1.9:1.
   - `SavingsClient.tsx:408` white 11px text on `bg-amber-500`: 2.13:1.
   - `text-zinc-400` on white across the split bill screens: about 2.6:1.
   - `text-zinc-500` at 10 to 11px on dark cards (savings, breakdown): 3.7 to 3.9:1.
7. **R-02: em dash in the UI. [V]** `compare/DailyTrendComparison.tsx:308` and `:437` render `"—"` for future days. Also in the push notification body at `api/notifications/test/route.ts:40`.
8. **R-34: three loading skeletons are dark only. [V]** `app/loading.tsx`, `compare/loading.tsx` and `archive/loading.tsx` contain zero `dark:` classes and use `bg-zinc-800/900`, so light-mode users see dark blocks while loading. `app/loading.tsx` is also the fallback for `/saku`, `/split`, `/split/new` and `/split/[id]`, where its dashboard shape is wrong.
9. **R-27: missing error states. [V for files; A for handlers]** There is no `error.tsx`, `global-error.tsx` or `not-found.tsx`. The five savings handlers (`SavingsClient.tsx:162-286`) use `try/finally` with no `catch`, so a failed save shows nothing. `PendingTransactionsBanner.tsx` and `EmailSyncSettingsModal.tsx` only `console.error`. `split/page.tsx:59` shows a failed query as "no bills yet". The app uses native `alert()` or `confirm()` 21 times.
10. **R-26: dead and hover-only controls. [V for the emoji button; A for the rest]** `saku/SakuFormModal.tsx:201` emoji button has no `onClick`. The savings history delete button is `opacity-0` until hover, so touch users never see it. `SplitBillViewer.tsx:341` uses a clickable `div` with no role or keyboard handler.
11. **R-37: no design direction exists. [V]** No `DESIGN.md`, two color tokens in `globals.css`, no stated dials. Everything downstream follows from this.

## B. Antislop Purpose-Gate (MEDIUM)

12. **R-04: Sparkles icon used 31 times [V]**, for AI, for "over budget", for "best saving", for empty states and for the signup button. Lightning icon for "Catat Secepat Kilat" on the welcome screen. All icons are Lucide defaults.
13. **R-06: 49 uppercase wide-tracked labels at 10 to 11px [V]** (`PENGELUARAN MINGGU INI`, `DETEKSI EMAIL...`, `TABUNGAN POKOK`). Geist and Geist Mono are the framework defaults with no written reason; Geist Mono is loaded on every route and used 11 times, none on the dashboard.
14. **R-01, R-13: decorative gradients and glow. [A]** Amber to orange gradient on the email banner (`PendingTransactionsBanner.tsx:109`), teal to emerald gradient plus a `blur-2xl` glow on the AI card (`AiAdvisorCard.tsx:91,94`).
15. **R-10: `backdrop-blur` used 38 times [V]**, including on list rows and the fixed nav. The dose cap is 1 to 2 elements.
16. **R-09: capsule badges with no function. [A]** `DeepSeek AI`, `deepseek-chat`, `BYOK`, `FREE TIER` shown to students.
17. **R-08: arrows on buttons. [V on dashboard]** `Lihat →`, `Tanya AI →`, `Kelola →`, `Lanjutkan →`.
18. **R-05, R-14: welcome screen is the three-identical-feature-cards template [V]** (icon, bold title, two lines, three times) with buzzword titles ("Wawasan Finansial Cerdas", R-16) and a generic `Lanjutkan` CTA (R-15).

## C. Antislop Quality Locks (LOW)

19. **R-29: 14 color families in use. [V]** Counted class uses in `app/`: emerald 425, amber 408, teal 309, rose 242, purple 94, blue 86, indigo 55, orange 36, pink 29, plus red, violet, yellow, green, cyan. One dashboard screen shows amber, pink, indigo, emerald, teal and blue together. Each account menu icon has its own color.
20. **R-11: nearly everything is pill shaped. [V]** Nav, Add button, tabs, chips, badges, toggles.
21. **R-20: no identity. [V]** Swap the logo and this is any zinc Tailwind dashboard.
22. **R-21: dark is the default with no stated reason. [V]** `layout.tsx:70` falls back to `dark`; `themeColor` and the manifest colors are dark only, so the light theme gets a dark status bar. A working toggle exists.
23. **Text under 12px: 428 class uses [V]** (`text-[11px]` 243, `text-[10px]` 170, `text-[9px]` 15).

---

## D. UX findings

24. **HIGH. First visit shows a modal over nothing. [V]** `GuestLanding` renders only a modal on an empty page. The risk card sits inside an inner scroll area (556px of content in a 427px box) and is half hidden, while `Lanjutkan` is always visible. Three separate controls lead to login.
25. **HIGH. A stray tap on the welcome backdrop creates a guest account. [V]** `WelcomeGuestModal.tsx:45-50` submits the guest form on backdrop mousedown.
26. **HIGH. Expense search only searches today. [V]** `ExpenseList.tsx:60,91-94` defaults the list to `today`, and search filters that subset. An agent searched the monthly view (22 entries) and got "0 of 2".
27. **HIGH. Compare headline is misleading. [V]** `compare/page.tsx:120-122` compares this week's partial total with last week's full total. On day 3 it showed "83% lebih hemat". The fair per-day figure is computed at `:128-129` but shown lower down.
28. **HIGH. Split bill charges everything to the host by default. [V]** `SplitBillCreator.tsx:120` assigns the first item to the creator only, and `handleAddParticipant` (`:367-379`) never assigns new friends to existing items. Only the bottom summary reveals it. Removing a participant can leave an item unassigned, which the calculator then silently splits across everyone [A].
29. **HIGH. Editing a subscription erases its notes. [V]** The form has no notes field, `setNotes` is only ever called with `""`, and `actions.ts:99` writes that back as `null`.
30. **HIGH. Four features are only in the three-dot menu. [V]** Archive, Split Bill, Subscriptions and Notifications. The menu is 12 items in one flat list mixing navigation and settings. Split bill pages also hide the bottom nav, so getting home takes two taps.
31. **HIGH. The whole Saku feature is unreachable. [V]** `utils/wallets/config.ts:14` sets `FEATURE_MULTI_SAKU_ENABLED = false`; `/saku` and `/saku/[id]` redirect to `/savings`. About 1,500 lines of wallet UI ship as dead code, and the word "Saku" still appears in other screens.
32. **MEDIUM. Add modal has three modes in one header [A]** ("Ketik Cepat", "Standar", "Upload Foto") with no explanation; it wraps to two rows. The modal stays open after a quick save by default, costing a third tap. The standard form accepts Rp 0.
33. **MEDIUM. Money inputs are raw `type="number"`. [A]** No thousands grouping while typing. The goal placeholder `cth. 1.000.000` invites dots, which the field rejects silently.
34. **MEDIUM. Auth errors are raw English Supabase messages in an Indonesian UI [A]**; no forgot-password link exists anywhere; no show-password toggle.
35. **MEDIUM. Signed-out visitors see the bottom nav and Add button behind the welcome modal. [V]**
36. **MEDIUM. Export recap can show a Rp 500.000 budget the user never set [A]** (`ArchiveWeekList.tsx:193` does not pass the budget; `ExportShareModal.tsx:32` defaults it).
37. **MEDIUM. Copy to clipboard reports success even when it fails. [A]** `SplitBillViewer.tsx:111,119`.
38. **MEDIUM. Mixed languages. [A]** Dozens of hardcoded Indonesian strings in savings, saku, split and add expense, and hardcoded English ones (`One-Off`, `Ready`, `Detail`, `Authentication failed`).
39. **LOW. Unverified:** the AI assistant quoted a weekly budget of 450.000 while the dashboard showed Rp 350.000. Both use `resolveBudgets`, so this may be a model error. Not reproduced.

## E. UI clutter

40. **Dashboard buries the expense list. [A, layout V]** At 375x812 the order is header, cadence toggle, email banner (162px), subscription banner (66px), budget hero (459px), AI card, breakdown, then the list at about 1.7 screens down (weekly) or 2.4 (monthly). Today's spending is only visible inside the breakdown.
41. **Three fixed layers at the bottom. [V]** A 144px gradient, a floating Add pill and a floating nav pill. The Add pill covers content.
42. **Five routes to AI on one screen. [A]** Header button, `Tanya AI`, two teaser chips, menu toggle.
43. **Savings page shows about 20 figures before the history [A]**, with repeats, and three entry points for a manual deposit. "Alirkan" and "Alokasikan" name two different actions with near-identical words.
44. **Header wraps at 375px. [V]** The title breaks to two lines and "42 Hari" wraps inside its pill.
45. **Archive expands to 7,877px with every week open [A]** and gives each week its own search field.

## F. Pain points for a college student

- **Slow or no signal:** the app does nothing offline (see 46). Logging lunch in a canteen with one bar of signal fails outright.
- **One hand, small phone:** primary controls are 24 to 40px tall and the secondary ones 16 to 22px.
- **Reading on the move:** 428 uses of text at 11px or smaller, some in low-contrast grey.
- **"Is this homework?":** the dashboard asks them to parse six cards and seven colors before showing what they spent today.
- **Vocabulary:** Saku, Dompet Utama, Tabungan, Tabungan Pokok, Sisa Anggaran, Alirkan, Alokasikan, PB1, PPN, BYOK. No glossary, no onboarding.
- **Trust:** a guest can be created by accident, guest data lives in one browser, and failed saves are silent.
- **Splitting with friends:** the most social feature is hidden in a menu and its default charges the host for everything.
- **Bank email sync:** requires creating a Gmail filter and a forwarding address in four steps plus a hidden verification step.
- **Irregular income:** income entry exists only inside the disabled Saku feature.

## G. PWA and performance

Measured from a real `next build` (Next 16.3.4, Turbopack): all JS chunks total 1,698,821 bytes raw and 463,942 bytes gzip; one CSS file of 164,470 bytes raw. Per-route first-load size, Lighthouse and Web Vitals: **not measured**.

46. **HIGH. No offline support. [V]** `public/sw.js` handles install, activate, push and notificationclick only. No fetch handler, no cache, no offline page.
47. **HIGH. Heavy modals ship on every route. [V imports; size per route not measured]** `layout.tsx` mounts `BottomNav`, which statically imports the 1,952-line add modal (which imports the 1,076-line image upload modal), and `AiAssistantProvider`, which statically imports the AI sheet with `react-markdown` and `remark-gfm`. The chunk containing remark and micromark is 185,773 bytes raw, 54,891 gzip. There is no `next/dynamic` or `React.lazy` anywhere in `app/`.
48. **HIGH. Dashboard does about seven sequential server round trips before rendering. [A]** `page.tsx` calls `auth.getUser` twice (once inside `processSubscriptionRenewals`), reads wallet balances twice, and runs the email query after the parallel batch. It also selects every expense date the user has ever logged to compute the streak.
49. **MEDIUM. PWA icons are wrong. [V]** `icon-192.png` and `icon-512.png` are the same 2000x2000, 126 KB file. No maskable safe zone, no shortcuts, no screenshots. Theme and background colors match dark mode only.
50. **MEDIUM. Every route is server-rendered on demand [V]**, so an installed app pays auth and database round trips on each navigation and has nothing cached for repeat visits.
51. **MEDIUM. `canvas-confetti` and `qrcode` are static imports [V]**; the QR code is generated on mount for every visitor to a split bill.
52. **MEDIUM. CSS weight. [A]** 473 arbitrary-value utilities, 277 distinct color-opacity utilities and 2,782 `dark:` occurrences feed the 164 KB stylesheet. A token-based palette would shrink this.
53. **LOW.** 38 `backdrop-blur` uses, some per list row, are a scroll jank risk on cheap Android phones (not measured on a device). `InstallPrompt` has no iOS path. `login/GoogleSignInButton.tsx` and the default export of `QuickAddExpense.tsx` are unused.

---

## Coverage and click-through evidence

| Route or surface | Signed in | Signed out | Light | Evidence |
|---|---|---|---|---|
| `/` dashboard | yes | yes | yes | Loads, no console errors. Budget modal opens, Batal closes, Escape does not. Bulanan switches period. Search and Reset filter work on today's set only. |
| Welcome modal | n/a | yes | no | Renders after cancelling login. Inner scroll 556/427. Backdrop submit confirmed in code, not clicked. |
| Login and signup modal | yes | yes | no | Opens via `?auth=login`. Login with the test user succeeds. Escape does not close. |
| Account menu | yes | n/a | no | Opens, 12 rows, Escape closes and returns focus. Keluar signs out. |
| Add expense modal | yes | n/a | yes | Quick parse preview correct; standard save created one row; Escape does not close. |
| AI sheet | yes | n/a | no | Opens, one question answered in about 12 s, Escape closes. |
| `/savings` | yes | n/a | yes | Goal, allocate, sweep and balance modals open and cancel; Escape does not close. |
| `/saku`, `/saku/[id]` | redirect | redirect | n/a | Both redirect to `/savings`. Saku UI reviewed in code only. |
| `/subscriptions` | yes | n/a | no | Add and edit forms open and cancel. One React key warning in the console. |
| `/split`, `/split/[id]` | yes | yes (curl) | no | Viewer expands, QR dialog opens, Tutup closes, Escape does not. Friend view returns 200 without cookies. |
| `/split/new` | code only | redirect | no | Did not hydrate in the agent's hidden tab; reviewed in code. |
| `/compare` | yes | n/a | yes | Day selection works; future day shows the em dash. |
| `/archive` | yes | n/a | no | Buka semua expands six weeks. |
| Export modal | yes | n/a | no | Both tabs render; nothing downloaded or shared. |
| Email sync and notification modals | code only | n/a | no | Not opened live. |

Not covered: a fresh guest session (creating one adds an anonymous user to the live project; the guest dashboard was seen once at the start), image upload, push notification enablement, real devices, and screen reader testing.

One discarded finding: an agent reported blank friend names on a split subscription. That was my seed data in the wrong shape, not an app bug.

---

## Redesign directions (pick one)

All three keep the working parts listed in the verdict, replace the 14 hues with tokens, and fix the Hard Gate items as part of the rebuild. The logo and app icon are not touched until you say what you want there (R-23).

### 1. Warung (warm and playful), recommended
- **Read:** a daily money notebook for students, in a warm paper-and-ink language. Dials ENERGY 2 / RHYTHM 2 / MOTION 2.
- **Palette:** cream `#FFF8EC` base, ink `#2B2118` text, tangerine `#E8590C` as the single accent (with ink text on it), leaf green `#2F7D4F` for "under budget" only. Dark mode is warm brown, not zinc.
- **Type:** Plus Jakarta Sans, a typeface drawn for Jakarta, with tabular figures for Rupiah amounts.
- **Motif:** receipt-style torn edge on the day's summary; one number per screen is the focal point ("Sisa hari ini").
- **Why:** it matches the name (saku, pocket) and the persona, and is the furthest from a banking dashboard.

### 2. Segar (fresh and calm)
- **Read:** a quiet allowance tracker in a soft botanical language. Dials ENERGY 1 / RHYTHM 2 / MOTION 1.
- **Palette:** off-white `#F6F8F4`, deep green `#0F5132` for text and primary actions, mint `#CDEBD8` surfaces, coral `#D9480F` reserved for over-budget states.
- **Type:** Figtree, friendly but neutral.
- **Motif:** a single progress ring that fills through the week.
- **Why:** the lowest risk and the least work, but the least distinctive.

### 3. Kantong (bold blocks)
- **Read:** a loud, sticker-like money app. Dials ENERGY 3 / RHYTHM 3 / MOTION 2.
- **Palette:** white and ink `#1A1A1A`, with one block color per area: budget yellow `#FFD43B`, savings teal `#0B7285`, split violet `#5F3DC4`; coral for alerts.
- **Type:** Bricolage Grotesque for headings and amounts, DM Sans for body.
- **Motif:** each section is a full-width color block with oversized numbers.
- **Why:** the most memorable and the hardest to keep accessible and uncluttered.

Whichever is chosen, the structural changes are the same: a first screen that answers "how much can I spend today", the expense list directly under it, a four-item bottom nav with Add in the middle, split bill and subscriptions promoted out of the menu, one AI entry point, and real dialogs with labels, focus handling and 44px targets.
