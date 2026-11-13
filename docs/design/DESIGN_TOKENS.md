# SakuTrack design tokens (as built)

Recorded during Audit 002 (2026-11-13). Describes the code at commit `a66510c` (master). Every value is quoted from source; nothing here is proposed. Intent comes from `docs/design/DESIGN.md` (dated 2026-11-11); where code differs it is listed in "Gaps". Stack: Next 16.3.4, React 19.2.8, Tailwind `^4` (`package.json`). Counts are `grep -o` matches over `app/**/*.tsx` (66 files), so one class on one element = 1.

## 1. Where tokens live

| Layer | File:lines | What |
|---|---|---|
| Semantic CSS variables, light default | `app/globals.css:10-29` | `--paper --card --ink --ink-soft --line --accent --accent-strong --on-accent --ok --ok-soft --danger --danger-soft --muted-400 --muted-500`, plus `--background/--foreground` aliases |
| Dark | `app/globals.css:31-46` (`.dark`) | same names |
| Palette overrides | `app/globals.css:55-195` | `:root[data-palette="pink\|blue\|mono"]` and `:root.dark[data-palette=...]` |
| Tailwind utility names | `app/globals.css:197-214` (`@theme inline`) | `--color-paper/card/ink/ink-soft/line/accent/accent-strong/on-accent/ok/ok-soft/danger/danger-soft`, `--font-sans`, `--font-mono` |
| Legacy colour remap | `app/globals.css:225-405` (`@theme`) | 15 Tailwind families re-pointed (section 4) |
| Palette list, hybrid schedule, paper colours | `utils/theme/palette.ts:5-41` | `PALETTES`, `HYBRID_SCHEDULE`, `PAPER` |
| Pre-paint script | `utils/theme/palette.ts:45-47` | `THEME_BOOT_SCRIPT` |
| Runtime switching | `utils/theme/context.tsx` | `ThemeProvider`, `useTheme` |
| Dark variant | `app/globals.css:3` | `@custom-variant dark (&:where(.dark, .dark *))` (class-based, not media-query) |

Not defined anywhere in the repo (Tailwind v4 defaults from `node_modules/tailwindcss/theme.css` are used as-is): spacing scale, radius scale, shadow scale, type scale, breakpoints, z-index, easing, durations. `globals.css` has no `--radius-*`, `--shadow-*`, `--text-*`, `--spacing`, `--z-*`, `--ease-*`, `--breakpoint-*`.

## 2. Colour tokens

Cell = light / dark. `ok`, `danger`, `ok-soft`, `danger-soft` are not overridden by any palette (identical in all four).

| Token | Orange (`:root`, `.dark`) `globals.css:10-46` | Pink `:55-98` | Blue `:101-144` | Mono `:147-195` |
|---|---|---|---|---|
| paper | #fff8ec / #1a130d | #fff5f7 / #1b1015 | #f3f7fc / #0d1421 | #f6f6f4 / #121212 |
| card | #ffffff / #261d15 | #ffffff / #28181f | #ffffff / #16202f | #ffffff / #1e1e1e |
| ink | #2b2118 / #f6ebdd | #2e1720 / #fbe9ef | #14213a / #e6eefa | #1c1c1c / #f0f0f0 |
| ink-soft | #6b5a48 / #c4b29b | #6e4a58 / #d1aebb | #4a5b78 / #a8b8d0 | #5c5c5c / #b0b0b0 |
| line | #ead9bd / #3d3024 | #f2d5de / #45293a | #d5e0ee / #263449 | #e0e0dc / #333333 |
| accent | #e8590c / #f98229 | #d6336c / #f06595 | #1f6feb / #5b9bff | #1c1c1c / #f0f0f0 |
| accent-strong | #c2470a / #ffa65c | #a61e4d / #ff8fb3 | #1553b8 / #8cb8ff | #000000 / #ffffff |
| on-accent | #17110b / #17110b | #ffffff / #1b0a11 | #ffffff / #07111f | #ffffff / #121212 |
| muted-400 (legacy `zinc-400`) | #7f6e57 / #ae9d85 | #85606e / #b993a2 | #5f7090 / #8fa1bd | #707070 / #9a9a9a |
| muted-500 (legacy `zinc-500`) | #6b5a48 / #b5a48c | #6e4a58 / #c3a0ad | #4a5b78 / #9badc7 | #5c5c5c / #a6a6a6 |
| ok | #2f7d4f / #7fc596 | same | same | same |
| ok-soft | #edf7f0 / #1a412c | same | same | same |
| danger | #b3261e / #ee9085 | same | same | same |
| danger-soft | #fdf0ee / #5f1b17 | same | same | same |

Shared token lines: `ok` `:19`/`:40`, `ok-soft` `:20`/`:41`, `danger` `:21`/`:42`, `danger-soft` `:22`/`:43`.

Other colour facts:
- `PAPER` (browser chrome colour) duplicates the paper hexes: orange `#fff8ec/#1a130d`, pink `#fff5f7/#1b1015`, blue `#f3f7fc/#0d1421`, mono `#f6f6f4/#121212` (`palette.ts:36-41`). They match `globals.css` today but are separate literals.
- `app/manifest.ts:14-15`: `background_color: "#fff8ec"`, `theme_color: "#fff8ec"` (static orange light; ignores palette and dark).
- Shadow colours hard-coded outside tokens: `.receipt` `rgb(43 33 24 / 0.22)` (`globals.css:504`), `.dark .receipt` `rgb(0 0 0 / 0.6)` (`:508`), BottomNav `shadow-[0_-4px_16px_rgb(43_33_24/0.06)]` (`app/BottomNav.tsx:60`).
- Overlay scrims (no token): `bg-black/60` 14, `bg-zinc-950/60` 10, `bg-zinc-950/70` 4, `bg-zinc-950/40` 7, `bg-zinc-950/80` 2, `bg-black/75` 1.
- Raw hex still in TSX (excluding CSS): wallet colour picker `app/saku/SakuFormModal.tsx:19-27` (9 colours: #10b981 #0d9488 #3b82f6 #6366f1 #8b5cf6 #ec4899 #f59e0b #f43f5e #71717a), `app/saku/SakuCard.tsx:39-50`, `app/saku/[id]/page.tsx:134-143`, chart `app/savings/SavingsBalanceHistory.tsx:321-333` (#14b8a6, #0d9488), annotation pen `app/ai/ImageUploadModal.tsx:87,607-609` (#ef4444 #f59e0b #10b981), QR `app/split/[id]/SplitBillViewer.tsx:88` (#ffffff), palette swatches `app/UserMenu.tsx:69-74` (#e8590c #d6336c #1f6feb #1c1c1c + conic-gradient).
- Neutral white/black utilities: `bg-white` 155, `text-white` 120, `bg-black` 16, `border-white` 9.

### Token usage in `app/` (utility prefixes bg/text/border/ring/from/to/via/fill/stroke/divide/placeholder/outline)

| Semantic | n | | Legacy family | n |
|---|---|---|---|---|
| ink | 211 | | zinc | 3050 |
| line | 176 | | emerald | 361 |
| ink-soft | 105 | | teal | 259 |
| card | 71 | | amber | 243 |
| paper | 52 | | rose | 202 |
| accent | 49 | | purple | 82 |
| danger | 24 | | blue | 49 |
| on-accent | 21 | | orange | 25 |
| accent-strong | 14 | | indigo 22, pink 11, violet 10, red 8, yellow 2, green 2 | 55 |
| ok | 14 | | slate/gray/neutral/stone/cyan/sky/lime/fuchsia | 0 |
| danger-soft 5, ok-soft 2 | 7 | | | |

Totals: semantic 744, legacy families 4326. `dark:` variant appears 2049 times.

## 3. Palette and theme switching

**Attribute model** (`context.tsx:22-30`, `applyToDocument`): `<html class="dark">` for dark; `data-palette="pink|blue|mono"` set, and **removed** for `orange` (orange is the un-attributed `:root`). `style.colorScheme` is set to the theme. The `meta[name="theme-color"]` content is set to `PAPER[palette][theme]`.

**CSS precedence**: `:root[data-palette="x"]` (light values) also matches in dark mode; `:root.dark[data-palette="x"]` then overrides only semantic tokens (and, for mono only, amber 300-600 `globals.css:181-184`). Pink and blue dark blocks do **not** redeclare the zinc/amber ramps, so dark pink/blue use the light-palette ramps (`globals.css:66-85`, `112-131`).

**Persistence**: theme = cookie `THEME` + `localStorage.theme` (`context.tsx:74-75`); palette = cookie `PALETTE` (`:85`); both `max-age=31536000; SameSite=Lax` (`:20`). Server reads: `utils/theme/server.ts` (default `"light"` / `"orange"`). No `prefers-color-scheme` read anywhere in `app/` or `utils/` (grep: 0).

**Hybrid** (`palette.ts:16-21`, `HYBRID_SCHEDULE`, local hour):

| From hour | Palette |
|---|---|
| 05 | orange |
| 11 | blue |
| 15 | pink |
| 19 | mono (also 00:00-04:59, the `paletteForHour` default `palette.ts:24`) |

- First paint: `THEME_BOOT_SCRIPT` inline in `<head>` (`layout.tsx:72-74`) reads cookies/localStorage, toggles `.dark`, resolves hybrid from `new Date().getHours()` using the same schedule data, sets/removes `data-palette`.
- Server render: `layout.tsx:67` emits `data-palette` only for pink/blue/mono (hybrid and orange emit none); `generateViewport` maps hybrid to orange for `themeColor` (`layout.tsx:38`).
- Client: `ThemeProvider` initial `activePalette` for hybrid is `"orange"` (`context.tsx:45-47`), corrected in an effect; re-checks every `60_000` ms (`:54`) and on `visibilitychange` (`:56`) while `palette === "hybrid"`.

## 4. Legacy Tailwind colour remap (`globals.css:225-405`)

| Tailwind family | Maps to | How | Lines |
|---|---|---|---|
| zinc | warm paper/ink neutrals | explicit hex 50-300, 600-950; 400/500 = `var(--muted-400/500)` | 226-236 |
| amber | tangerine ramp (accent) | explicit hex 50-950 (`500 #e8590c`, `600 #c2470a`) | 238-248 |
| emerald | leaf (ok) | explicit hex (`600 #2f7d4f`) | 250-260 |
| rose | brick (danger) | explicit hex (`600 #b3261e`) | 262-272 |
| orange, yellow | amber | `var(--color-amber-N)` | 274-296 |
| teal, green | emerald | `var(--color-emerald-N)` | 298-320 |
| red | rose | `var(--color-rose-N)` | 322-332 |
| blue, indigo, violet, purple, pink, cyan | zinc (neutral) | `var(--color-zinc-N)` | 334-404 |

15 families remapped (4 defined + 11 aliases). Palette blocks re-define only zinc and amber ramps (not emerald/rose), so green/red families never change with palette. Shades 50-950 all remapped. Families not remapped (slate, gray, neutral, stone, sky, lime, fuchsia) are used 0 times.

## 5. Typography

| Item | Value | Source |
|---|---|---|
| Family | Plus Jakarta Sans via `next/font/google`, `variable: "--font-jakarta"`, `subsets: ["latin"]`, `display: "swap"` | `app/layout.tsx:2,13-17` |
| Applied | body class `${jakarta.variable} font-sans ... antialiased` | `layout.tsx:77` |
| Fallback | `--font-sans: var(--font-jakarta), system-ui, sans-serif`; same in `body {}` | `globals.css:212,410` |
| Mono | `--font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`; `font-mono` used 10x, `font-sans` 11x | `globals.css:213` |
| Numerals | `body { font-variant-numeric: tabular-nums }`; explicit `tabular-nums` class 20x | `globals.css:411` |
| Input size | 16px on `(pointer: coarse)` for input/select/textarea | `globals.css:447-453`; `CONTROL_CLASS` also `text-base` (`app/ui/Field.tsx:6`) |
| Pinch zoom | viewport sets only `width: "device-width"`, `initialScale: 1` (no `maximumScale`/`userScalable`) | `layout.tsx:39-40` |

Size scale in use (Tailwind v4 defaults, `theme.css:347-361`; not overridden):

| Class | px (rem) | Count |
|---|---|---|
| text-xs | 12 (0.75) | 727 |
| text-sm | 14 (0.875) | 183 |
| text-base | 16 | 44 |
| text-lg | 18 | 19 |
| text-2xl | 24 | 16 |
| text-xl | 20 | 13 |
| text-3xl | 30 | 5 |
| text-4xl | 36 | 2 |
| arbitrary `text-[..]` | 15px | 1 (`app/email-sync/EmailSyncSettingsModal.tsx:274`) |

Weights: `font-semibold` 362, `font-bold` 197, `font-medium` 156, `font-black` 20, `font-normal` 12, `font-extrabold` 12. `uppercase` 0, `tracking-*` 0. Inline `fontSize` styles 0.

## 6. Radius, shadow, blur

Radius (Tailwind v4 defaults `theme.css:397-404`): `rounded-xl` 12px **318**, `rounded-2xl` 16px 115, `rounded-lg` 8px 98, `rounded-full` 76, `rounded-xs` 2px 45, `rounded-3xl` 24px 38, `rounded-md` 6px 33, `rounded` 17, `rounded-t-3xl` 5, `rounded-sm` 3, `rounded-t-xs` 4, `rounded-t-2xl` 2, `rounded-t-md` 2, `rounded-tl-xs` 2, `rounded-tr-xs` 1. Shared components: Button `rounded-xl` (`Button.tsx:30`), Field control `rounded-xl` (`Field.tsx:6`), Dialog panel `rounded-t-2xl sm:rounded-2xl` (`Dialog.tsx:104`).

Shadow utilities (v4 defaults `theme.css:407-412,506`): `shadow-xs` 96, `shadow` 48, `shadow-2xl` 24, `shadow-sm` 17, `shadow-md` 14, `shadow-xl` 4, `shadow-lg` 4, `shadow-inner` 2 (total 209). Arbitrary: `BottomNav.tsx:60`; `ImageUploadModal.tsx:678` (`shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]`). CSS: `.receipt` drop-shadow filter `globals.css:503-509`.

Blur: 3 uses (`backdrop-blur-[1px]` `ImageUploadModal.tsx:841`; `blur-2xl` `AiAdvisorCard.tsx:94`; blur `TrackingStreak.tsx:94`).

`.receipt-edge` (`globals.css:456-461`): `--tooth: 10px`; `mask` = conic-gradient teeth `bottom / var(--tooth) 51% repeat-x` + `linear-gradient(#000 0 0) top / 100% calc(100% - var(--tooth) / 2) no-repeat`. Companion `.receipt` adds the drop-shadow outline (`:503-509`). `.receipt-edge` used once (`DashboardClient.tsx:502`); `.receipt` used on 3 cards.

## 7. Spacing, sizing, layout

No custom spacing scale (Tailwind `--spacing` 0.25rem steps). Utility families (count of class occurrences): `gap-*` 575, `p-*` 316, `px-*` 312, `py-*` 294, `mt-*` 220, `space-y-*` 107, `mb-*` 93.

Most-used individual classes: `gap-2` 194, `gap-1.5` 152, `px-3` 104, `gap-3` 85, `p-4` 80, `py-1.5` 73, `mt-0.5` 71, `gap-1` 70, `py-2` 65, `px-4` 54, `py-1` 49, `px-2.5` 48, `p-3` 48, `mt-1` 48, `py-2.5` 43, `mb-1` 41, `p-5` 38, `space-y-3` 35, `mt-3` 32, `mt-2` 31.

Arbitrary sizes: `max-h-[90vh]` 6, `max-h-[92vh]` 3, `min-h-[70dvh]` 2, `h-[90vh]` 2, `max-h-[92dvh]` 1 (Dialog `Dialog.tsx:104`), others single-use (`w-[85%]`, `w-[140px]`, `h-[86vh]`, `h-[82vh]`, `max-h-[780px]` ...).

Container: `max-w-md` (448px) 32, `max-w-sm` 12, `max-w-lg` 3, `max-w-xs` 3, `max-w-xl` 1. Page bottom padding reserved for bar: `pb-24`/`pb-28` 7 (e.g. `app/loading.tsx`).

Touch sizing: `min-h-11` (44px) 45, `h-11` 19, `min-h-12` 5, `min-h-14` 3, `h-12` 6, `h-14` 6; sub-44 `h-8`/`h-9`/`h-10` 43; `min-h-9`/`min-h-10` 0. Coarse-pointer hit-area rule (`globals.css:517-545`, `@layer base`): `button, a[href], summary, [role=button|switch|tab]` get `position: relative` and a `::after` with `min-width/min-height: 44px`, centred, `content: ""`. Not applied to `input`, `select`, `textarea`, `label`, checkbox/radio.

Breakpoints (Tailwind defaults `theme.css:327-331`): `sm:` (640px) **100** occurrences; `md:` 0; `lg:` 0; `xl:` 0; `2xl:` 0. Only `sm:` is used (typically `items-end sm:items-center` bottom-sheet to centred-modal; `Dialog.tsx:91`).

## 8. Motion

| Item | Value | Source |
|---|---|---|
| `fadeIn` | opacity 0 to 1; class `.animate-fade-in` = `200ms ease-out forwards` | `globals.css:463-470,483-485` |
| `modalIn` | opacity 0, `scale(0.96) translateY(8px)` to identity; `.animate-modal-in` = `240ms cubic-bezier(0.16, 1, 0.3, 1) forwards` | `globals.css:472-481,487-489` |
| Tailwind duration utilities | `duration-300` 7, `duration-500` 3, `duration-200` 3, `duration-700` 2; `ease-out` 2 | grep |
| `transition-*` | `transition-all` 142, `transition-colors` 79, `transition-transform` 12 (default 150ms, `cubic-bezier(0.4,0,0.2,1)`, `theme.css:492-493`) | grep |
| `animate-fade-in` 45, `animate-modal-in` 11, `animate-spin` 15, `animate-pulse` 8, `animate-ping` 1 | | grep |
| `animate-scale-in` | used 5x (`app/savings/SavingsClient.tsx:600,691,820,883,1019`); no `@keyframes`/class of that name exists in `globals.css` or the repo | grep |
| Progress bar | `transition-all duration-700 ease-out` on width (`app/BudgetProgress.tsx:102`) | |
| Toasts | auto-dismiss timers 4500ms (`app/DashboardClient.tsx:127-142,386,392`), 3000ms (`TrackingStreak.tsx:49`, `AiAssistantSheet.tsx:133,140`) | |

Reduced motion: single global rule (`globals.css:491-500`): `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }`. Also `motion-safe:animate-pulse` once (`app/loading.tsx`); `motion-reduce:` 0. Scripted `scrollIntoView({ behavior: "smooth" })` (`AiAssistantSheet.tsx:113`) is not covered by the CSS rule.

Focus ring (`globals.css:420-423`, outside layers): `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`. Co-existing utility classes: `focus:outline-none|hidden` 34, `focus:ring-*` 78.
Cursor rules `globals.css:426-444`.

## 9. z-index

No tokens; Tailwind numeric utilities only: `z-50` 24, `z-40` 2, `z-10` 1, `z-20` 1, `z-[60]` 1, `z-[70]` 1.

| Layer | z | Source |
|---|---|---|
| Floating add FAB (legacy) | z-10 | `app/QuickAddExpense.tsx:1943` |
| Bottom nav | z-40 | `app/BottomNav.tsx:60` |
| Split bill action bar | z-40 | `app/split/new/SplitBillCreator.tsx:1503` |
| Dialog / ModalOverlay backdrops, dashboard toasts | z-50 | `Dialog.tsx:91`; 16 files; `DashboardClient.tsx:654` |
| Image upload modal | z-[60] | `app/ai/ImageUploadModal.tsx:491` |
| Savings error toast | z-[70] | `app/savings/SavingsClient.tsx:592` |

## 10. WCAG 2.x contrast (computed)

Script: `docs/audits/evidence/002/scripts/contrast.js` (relative luminance per WCAG 2.x; hex values transcribed from `globals.css` as in section 2). Run `node contrast.js`. `*` = below 4.5:1 (normal-text AA). Columns: Orange L, D / Pink L, D / Blue L, D / Mono L, D.

| Pair (fg / bg) | O-L | O-D | P-L | P-D | B-L | B-D | M-L | M-D |
|---|---|---|---|---|---|---|---|---|
| ink / paper | 14.92 | 15.61 | 15.61 | 15.91 | 14.92 | 15.78 | 15.75 | 16.44 |
| ink-soft / paper | 6.25 | 8.91 | 7.06 | 9.26 | 6.38 | 9.16 | 6.18 | 8.64 |
| ink-soft / card | 6.60 | 8.03 | 7.54 | 8.45 | 6.87 | 8.14 | 6.69 | 7.69 |
| on-accent / accent | 5.23 | 7.36 | 4.62 | 6.38 | 4.63 | 6.83 | 17.04 | 16.44 |
| accent-strong / paper | 4.74 | 9.50 | 6.74 | 8.69 | 6.59 | 9.14 | 19.41 | 18.73 |
| accent-strong / card | 5.00 | 8.56 | 7.21 | 7.92 | 7.09 | 8.13 | 21.00 | 16.67 |
| ok / paper | 4.77 | 9.04 | 4.72 | 9.13 | 4.68 | 9.07 | 4.66 | 9.21 |
| ok / card | 5.04 | 8.14 | 5.04 | 8.33 | 5.04 | 8.06 | 5.04 | 8.20 |
| danger / paper | 6.19 | 7.84 | 6.12 | 7.92 | 6.08 | 7.87 | 6.04 | 8.00 |
| danger / card | 6.54 | 7.06 | 6.54 | 7.22 | 6.54 | 6.99 | 6.54 | 7.12 |
| muted-400 / paper (legacy `zinc-400`) | 4.66 | 6.97 | 5.05 | 6.86 | 4.64 | 7.02 | 4.58 | 6.66 |
| accent / paper (non-text, 3:1 target) | 3.39* | 7.22 | 4.32* | 6.19 | 4.31* | 6.65 | 15.75 | 16.44 |

Result: **no text pair is below 4.5:1** (lowest: muted-400/paper mono-light 4.58, ok/paper mono-light 4.66, on-accent/accent pink-light 4.62). The `*` rows are `accent / paper`, which only has to meet 3:1 as a UI colour (all pass 3:1); it is not used as text colour by the semantic names (`accent-strong` is the text variant). Not computed: opacity-composited colours (`text-ink-soft/70` placeholder `Field.tsx:6`), legacy `dark:` zinc/teal/emerald pairings in old screens, `ok-soft`/`danger-soft` backgrounds.

## 11. Gaps between DESIGN.md and code

| # | DESIGN.md says | Code shows |
|---|---|---|
| 1 | `accent-strong` is "4.9:1 in light" (`DESIGN.md:29`) | 4.74:1 on paper (orange light); 5.00:1 on card |
| 2 | "Every dialog uses `app/ui/Dialog.tsx`" / "Every form field uses `app/ui/Field.tsx`" (`DESIGN.md:73-74`) | Dialog: 4 files; ModalOverlay: 16 files (21 uses); 1 hand-rolled. Field components: 3 files; 69 of 87 raw controls lack a programmatic label (see COMPONENT_GUIDELINES) |
| 3 | Legacy remap: "14 Tailwind color families" (`globals.css:217` comment; `DESIGN.md:39` says "every one of those families") | 15 families are remapped (4 ramps + 11 aliases) |
| 4 | Dialogs "fade and rise in 240ms" (`DESIGN.md:63`) | Panel `modalIn` 240ms; backdrop `fadeIn` 200ms; `animate-scale-in` (5 uses) has no definition and does nothing |
| 5 | "No looping or decorative animation" (`DESIGN.md:65`) | `animate-spin` 15, `animate-pulse` 8, `animate-ping` 1, `motion-safe:animate-pulse` on `loading.tsx` (looping; stopped by the reduced-motion rule only to one iteration at 0.01ms) |
| 6 | "Shadow: none on cards ... One soft shadow on the bottom bar. Blur: none" (`DESIGN.md:51-52`) | 209 shadow utility uses (shadow-xs 96, shadow 48, shadow-2xl 24 ...), `.receipt` drop-shadow filter (`globals.css:503-509`, not in DESIGN.md), 3 blur uses; bottom-bar shadow colour is hard-coded orange-brown in every palette/theme (`BottomNav.tsx:60`) |
| 7 | Radius "16px cards, 12px controls, full round only for Add button and avatars" (`DESIGN.md:50`) | `rounded-full` 76 uses; `rounded-3xl` (24px) 38 and `rounded-t-3xl` 5; `rounded-lg` 98; `rounded-2xl` 115 (16px) |
| 8 | "Limit: paper and ink neutrals, plus accent, ok and danger. No other hue." (`DESIGN.md:33`) | Hue-limiting is done by remap only; 4326 legacy colour-class uses vs 744 semantic; raw hex in TSX (section 2) incl. 9-colour wallet picker and chart/pen colours; `bg-white` 155 / `text-white` 120 |
| 9 | Palette switch swaps "the zinc and amber ramps" (`DESIGN.md:35`) | Only in light blocks; pink/blue dark blocks inherit the light ramps; mono dark overrides amber 300-600 only (`globals.css:181-184`) |
| 10 | "Every tappable control is at least 44px tall" (`DESIGN.md:72`) | Achieved partly via coarse-pointer `::after` hit area (`globals.css:517-545`), which excludes inputs/selects/labels/checkboxes; 43 `h-8/9/10` sizes remain |
| 11 | Hybrid "applied before first paint" (`DESIGN.md:37`) | True via head script; `themeColor` and `manifest.ts` stay orange for hybrid (client patches the meta tag only) |
| 12 | Inputs 16px on touch (`DESIGN.md:45`) | Met by `globals.css:447-453`; min 12px met (`text-xs` = 12px; only arbitrary size is 15px) |
| 13 | Single typeface (`DESIGN.md:43`) | `--font-mono` defined and `font-mono` used 10x (e.g. forwarding address `EmailSyncSettingsModal.tsx:274`); `font-black` 20, `font-extrabold` 12 not mentioned in DESIGN.md |
| 14 | Motif `.receipt-edge` "on the day's summary card, and nowhere else" (`DESIGN.md:13`) | `.receipt-edge` only at `app/DashboardClient.tsx:502`; but the companion `.receipt` wrapper (drop-shadow outline) is also on `app/compare/page.tsx:270` and `app/savings/SavingsClient.tsx:301` |

## 12. Commands used

```
grep -rhoE --include=*.tsx "text-\[[^]]+\]" app | sort | uniq -c | sort -rn
grep -rhoE --include=*.tsx "\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b" app | sort | uniq -c | sort -rn
grep -rhoE --include=*.tsx "\brounded(-(t|b|l|r|tl|tr|bl|br))?(-(none|xs|sm|md|lg|xl|2xl|3xl|full|\[[^]]+\]))?\b" app | sort | uniq -c | sort -rn
grep -rhoE --include=*.tsx "\bshadow(-(xs|sm|md|lg|xl|2xl|none|inner|\[[^]]+\]))?\b" app | sort | uniq -c | sort -rn
grep -rhoE --include=*.tsx "\bz-(\[[^]]+\]|[0-9]+)" app | sort | uniq -c
grep -rhoE --include=*.tsx "(^|[^a-z-])(sm|md|lg|xl|2xl):[a-z\[!-]" app | wc -l      # per breakpoint
grep -rhoE --include=*.tsx "\b-?(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y)-(0\.5|1\.5|2\.5|3\.5|[0-9]+|px)\b" app | sort | uniq -c | sort -rn
grep -rhoE --include=*.tsx "duration-[0-9a-z]+|ease-[a-z]+(-[a-z]+)?|\banimate-[a-z-]+|\btransition(-[a-z]+)?\b" app | sort | uniq -c
grep -rhoE --include=*.tsx "\b(bg|text|border|ring|from|to|via|fill|stroke|divide|placeholder|outline)-<family>-[0-9]+" app | wc -l   # per family
grep -rhoE --include=*.tsx "#[0-9a-fA-F]{6}\b" app | sort | uniq -c | sort -rn
node docs/audits/evidence/002/scripts/contrast.js
```
Counts of `tailwind` default values were read from `node_modules/tailwindcss/theme.css`.

## 13. Recommendations (not yet adopted)

- Tokenise the three hard-coded shadow colours and add `--z-*` names for the 6 layers in section 9, so Dialog/toast/nav stacking is not a convention only.
- Define or delete `animate-scale-in` (5 uses, currently inert).
- Keep `PAPER` in `palette.ts` and the `--paper` values in `globals.css` generated from one source, or add a test asserting they match.
