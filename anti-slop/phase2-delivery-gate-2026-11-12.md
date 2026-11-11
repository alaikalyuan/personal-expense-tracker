# Warung redesign, phase 2: Delivery Gate (2026-11-12)

Branch `redesign/warung`, uncommitted. Scope of this gate: every page outside the home screen (add expense, savings, Saku hub and detail, subscriptions, split bill history, creator and viewer, compare, archive, export, sign-in, welcome, offline). Audit finding numbers refer to `audit-001-2026-11-11.md`. Phase 1 is covered by `phase1-delivery-gate-2026-11-11.md`.

**Design read:** unchanged from phase 1, a daily money notebook for Indonesian college students in a warm paper-and-ink language, dial ENERGY 2 / RHYTHM 2 / MOTION 2 (`DESIGN.md`).

**Result for the phase 2 scope: PASS on contrast, text size, keyboard, states and semantics. PARTIAL on tap targets and structure: the add-expense modal, subscriptions form, email sync setup and split creator are recolored and keyboard-fixed but not restructured, and their small controls rely on the invisible touch hit area, not real 44px sizes.**

How it was checked: `tsc --noEmit` clean. `eslint app utils`: 18 errors, all on lines from earlier commits (checked with `git blame`), none from this branch. `next build` passes. Click-through on the dev server at 375x812 with the seeded test user, signed in through the app's own sign-in dialog. Each page was scanned by script for computed text contrast, text under 12px and controls under 44px, in light and in dark (dark set through the `THEME` cookie and a reload).

## Block 1: Hard Gate

| Rule | Result | Evidence |
|---|---|---|
| R-02 em dash | PASS | No em dash in UI strings under `app/`, `utils/i18n/` or `public/offline.html`. The two from the audit (`DailyTrendComparison.tsx`, `api/notifications/test/route.ts`) are gone. |
| R-03 mobile | PARTIAL | No horizontal overflow on any page at 375px. Zero controls under 44px on `/`, `/savings`, `/saku/[id]`. `/saku`: wallet card edit, archive and open links fixed to 44px. `/compare`: day bars are 38px wide (seven fit in 375px; height 120px). `/split/new`: 38 controls under 44px remain (chips, item rows); covered on touch devices by the base-layer 44px hit area only. |
| R-17, R-18, R-36, R-38 | PASS | No statistics, testimonials or claims added. |
| R-23 assets | PASS | No new assets. Logo artwork reused on the welcome page. |
| R-24 navigation | PASS | Bottom bar shows "Saku Saya" when Saku is on. The setting is now copied into its cookie at every sign-in (`syncMultiSakuCookie` in `utils/wallets/server.ts`, called from both password sign-in actions and the Google callback). Verified: after signing in, the cookie is `true` and the bar reads Beranda, Patungan, Saku Saya, Bandingkan. `/saku` and `/saku/[id]` load. |
| R-25 contrast | PASS | Zero text nodes below 4.5:1 (3:1 large) on: `/`, `/savings`, `/saku`, `/saku/[id]`, `/compare`, `/split/new` in dark, and `/`, `/savings`, `/split/new` in light. Phase 2 earlier sessions: `/subscriptions`, `/archive`, `/split` clean in both. Fixed today: compare hero card (white background left under a dark gradient), compare percentages (`dark:text-emerald-500` to `-400`), split method picker (inverted card at 2.5:1), split discount prefix (4.18:1). |
| R-26 controls | PASS | Copy buttons confirm only after the clipboard write resolves. Emoji button in the Saku form is no longer a dead button. Savings history delete is visible on touch. Every savings action reports failure. Compare chart toggle and split method and tax pickers report their state with `aria-pressed`. |
| R-27 states | PASS | Savings: empty goal state, zero-savings line, failure toast. Offline: tested with the dev server stopped; navigating to `/compare` showed "Tidak ada koneksi" from the service worker cache. Welcome page: guest account is created only by its button. |
| R-32 keyboard | PASS | All 22 legacy overlays use `ModalOverlay`: Escape closes, Tab stays inside, focus returns. Checked on savings (3 dialogs), subscriptions, export, add expense, streak, Saku (3). |
| R-33 | PASS | One-off scripts lived in the scratchpad, not the repo. |
| R-34 themes | PASS (by measurement and screenshot) | Dark screenshots taken of savings, compare, Saku hub, Saku detail and split creator; contrast scans above. |
| R-35 verify | PASS | See above. |
| R-39 semantics | PASS | Sign-in fields have labels tied by `htmlFor` and `autocomplete`. Savings goals are a list with a labelled `progressbar`. Wallet and goal icon buttons are named with the item ("Ubah Saku: Dompet Utama"). Confetti respects reduced motion. |
| R-40 performance | PASS | `canvas-confetti` is loaded on demand in savings. Production build total client JS, gzip: 565,571 bytes (phase 1 end: 537 KB, audit start: 464 KB). The growth since the audit is not explained by one chunk and is reported as an open item. No Lighthouse or Web Vitals figure is claimed: not measured. |

## Block 2: Purpose-Gate

| Rule | Result | Reason written |
|---|---|---|
| R-06 type | PASS | All uppercase tracked labels removed (0 left in `app/`). Zero text under 12px on every page scanned. |
| R-01 gradients, R-10 blur | PARTIAL | Removed from savings, compare and most cards. Left: `AiAdvisorCard`, `ProjectedBurnCard`, `TrackingStreak`, `archive/page.tsx`, two in `SavingsBalanceHistory` (chart fill and chart card), one blur in `ImageUploadModal`. |
| R-04 icons | PASS on savings | Decorative icons removed from the savings headings, balance and surplus cards. Other pages unchanged. |
| R-09 badges | PASS | Vendor badges removed from the assistant. |

## Block 3: Quality Locks

| Rule | Result | Note |
|---|---|---|
| Palette | PASS | Legacy colors are remapped onto the four Warung ramps; savings, Saku cards, sign-in buttons and split pickers now use the tokens directly. |
| Clutter (audit 43) | PASS for savings | Savings top now shows one focal number per card and one action each. Removed: the rotating quote banner, the scroll-to-history button, the duplicate "Tambah" deposit button, the repeated current-balance tile, four nested stat boxes. "Alirkan" and "Alokasikan" renamed to "Pindahkan ke tabungan" and "Isi target" (English: "Move to savings", "Add to goal"). |

## Open items

1. Structural redesign not done for the add-expense modal (three modes), the subscriptions form, the email sync setup and the split creator steps.
2. Small controls on those screens (38 on `/split/new`) still rely on the touch hit area.
3. Hardcoded strings remain, for example "Buka Catatan Belanja" on the Saku card and parts of savings, split and add expense.
4. No forgot-password flow.
5. Client JS grew from 464 KB to 566 KB gzip since the audit; cause not traced.
6. The 18 pre-existing lint errors (AI and email sync files) are untouched.
7. Test user `audit-test@sakutrack.test` and all its rows were deleted from the live Supabase project on 2026-11-12; a count query afterwards found none left.
