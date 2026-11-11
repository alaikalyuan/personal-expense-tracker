# Warung redesign, phase 1: Delivery Gate (2026-11-11)

Branch `redesign/warung`, uncommitted. Scope of this gate: the foundation (tokens, type, shared pieces, bottom bar, account menu, loading and error states, icons) and the home screen. Audit finding numbers refer to `audit-001-2026-11-11.md`.

**Design read:** a daily money notebook for Indonesian college students, in a warm paper-and-ink language, dial ENERGY 2 / RHYTHM 2 / MOTION 2. Direction file: `DESIGN.md`.

**Result for the phase 1 scope: PASS, with the open items listed at the end. The app as a whole does not pass yet: the pages in phase 2 still carry their audit findings.**

How it was checked: `tsc --noEmit` clean, `next build` compiles, and a click-through on the dev server at 375x812 with the seeded test user. One screenshot of the finished home screen was taken in light mode. After that the browser pane stopped drawing, so the remaining checks were done by driving the page with script and reading the DOM and computed styles, not by eye. Dark mode was checked by computed contrast only.

## Block 1: Hard Gate

| Rule | Result | Evidence |
|---|---|---|
| R-02 em dash | PASS | No em dash in any file touched in this phase. The one in `compare/DailyTrendComparison.tsx` is phase 2 (finding 7). |
| R-03 mobile | PASS | Home at 375px: no horizontal overflow; 22 interactive elements, none under 44px; all four nav labels fit. |
| R-17, R-18, R-36, R-38 | PASS | No statistics, testimonials or claims were added. |
| R-23 assets | PASS | Existing logo artwork only resized into 192, 512 and two maskable icons, as approved. |
| R-24 navigation | PASS | Bottom bar links: `/`, `/split`, `/savings` (or `/saku`), `/compare`. All exist. The bar is hidden for signed-out visitors and on `/split/new` and `/split/[id]`. |
| R-25 contrast | PASS | Computed contrast of all 57 text nodes on the home screen: zero below 4.5:1 (3:1 for large text) in light and in dark. |
| R-26 controls | PASS | Every control exercised, see the click-through. |
| R-27 states | PASS | Empty: no expenses, none today, no search match. Loading: `app/loading.tsx` rewritten with theme tokens. Error: `app/error.tsx` and `app/not-found.tsx` added; `/does-not-exist` shows "Halaman tidak ditemukan" with a link home. Budget save and subscription pay failures now show a message instead of `alert()` or nothing. |
| R-32 keyboard | PASS | Budget, edit expense and menu dialogs: focus moves in, Escape closes, focus returns to the opener. A global `:focus-visible` ring is defined outside the cascade layers so it also applies to old screens. |
| R-33 | PASS | Features are written in source. One-off find and replace was used only to rename classes; no patch script is left in the repo. |
| R-34 themes | PASS (by measurement) | Dark tokens defined; contrast scan clean in dark. Not visually inspected, see above. |
| R-35 verify | PASS | See the click-through. |
| R-37 direction | PASS | `DESIGN.md` written from the owner's choice. |
| R-39 semantics | PASS | Pinch zoom re-enabled (`maximumScale` removed; served viewport is `width=device-width, initial-scale=1`). Dialogs have `role="dialog"`, `aria-modal`, a labelled title. Every field in the budget and edit dialogs reports a label. `cursor: pointer` and `not-allowed` set once in base CSS. Reduced motion handled globally. One `h1` per page, `lang` set. |
| R-40 performance | PASS | No media added. First-load scripts for `/` do not include the markdown chunk or the add-expense chunks (checked against the HTML served by `next start`). No Lighthouse or Web Vitals number is claimed: not measured. |

## Block 2: Purpose-Gate (home screen)

| Rule | Result | Reason written |
|---|---|---|
| R-01 gradients, R-13 glow, R-10 blur | PASS | None on the home screen. |
| R-04 icons | PASS | Relevance rule in `DESIGN.md`. Sparkles removed from the header, toasts and budget card; the assistant is a chat bubble. |
| R-06 type | PASS | Plus Jakarta Sans, reason in `DESIGN.md`. No uppercase tracked labels left on the home screen. Zero text nodes under 12px. |
| R-08 arrows | PASS | None. Chevrons only on rows that navigate or expand. |
| R-09 badges | PASS | No capsule badges on the home screen. |
| R-12 shadow | PASS | Two uses, both with a reason: the bottom bar (floats over content) and the receipt edge (a border cannot follow the torn mask). |
| R-14 cards | PASS | The summary is a receipt, notices are single rows, the list is one ruled card, stats are a definition list. |
| R-19 motion | PASS | Dialog entrance and progress bar only, matching MOTION 2; all stops under reduced motion. |

## Block 3: Liveliness

- Dials declared: yes, in `DESIGN.md`.
- Consistent with dials: yes. Sections differ in composition (receipt, rows, ruled list, definition list).
- One focal point: "Sisa hari ini", 36px extra bold, alone at the top.
- Structural whitespace: 20px between blocks, dashed rules inside cards.
- One accent: tangerine on the Add button, the "Ubah budget" action and attention icons. Leaf appears only on the "Aman" status and the bar.
- Identity motif: the torn receipt edge, used once.
- Design Read declared: yes.

## Block 4: Craftsmanship and Quality Locks

| Item | Result | Evidence |
|---|---|---|
| C-1 to C-5 | PASS | Reasons in `DESIGN.md`; no dead control; no template section; states covered; no claims. |
| R-05 layout | PASS | Order follows the student's question: what can I spend, what needs attention, what did I buy, then insights. |
| R-11 radius | PASS | 16px cards, 12px controls, round only for Add. |
| R-15, R-16 copy | PASS | "Atur budget", "Ubah budget", "Ya, hapus", "Coba lagi". No buzzwords. |
| R-20 identity | PASS | Cream paper, ink, tangerine stamp, receipt edge. |
| R-21 theme | PASS | Light is the default by the owner's choice; the toggle is kept and themed. |
| R-29 palette | PASS | Neutrals plus accent, ok and danger. The 14 legacy color families are remapped onto these in `globals.css`, so no page can render an off-palette hue. |
| R-30 clone | PASS | Not modelled on another product. |
| R-31 reasons | PASS | `DESIGN.md`. |

## Click-through (375x812, seeded test user)

- Home loads with no new console errors. The one error still in the console buffer is from a broken intermediate save of `BreakdownCard.tsx` during the work; the file compiles now.
- "Ubah budget" opens "Budget Mingguan": focus lands in "Jumlah budget" showing `350.000`, numeric keypad mode. Escape closes it and focus returns to the button.
- Tapping "Gojek ke kampus" opens the edit dialog. Fields report labels: Nominal, Nama, Kategori, Tanggal, Catatan (opsional), and the one-off checkbox. The dialog fits the viewport.
- Delete button shows "Hapus pengeluaran ini? Tidak bisa dibatalkan." with "Batal" and "Ya, hapus". Cancelled, nothing deleted.
- Search for "kopi" reports "Menampilkan 0 dari 6 entri": it searched all six entries of the week, not only today's three. "Reset filter" clears it.
- "Hari Ini" and "Minggu Ini" switch the list; the week view groups by Hari Ini, Kemarin, Senin 9 Nov.
- Menu opens as a dialog with sections "Halaman" and "Pengaturan"; Escape closes and returns focus. Language, theme, currency and sign out were not activated.
- Add button: two script chunks are fetched on the first tap, the modal opens with the amount field focused, Tutup closes it. Nothing saved.
- Assistant button: three chunks fetched on first tap, sheet opens as a dialog, Escape closes it. No message sent.
- Email notice expands the review banner and collapses again. Nothing approved or dismissed.
- "Rincian minggu ini" expands with tabs Harian and Kategori.
- Bulanan: summary shows Rp 16.050 and "Rp 571.000 dari Rp 1.500.000 bulan ini"; the projection card appears.
- `/savings`, `/compare`, `/archive`, `/subscriptions`, `/split` load with the new bar, warm palette and no horizontal overflow.

## Numbers measured

| | Before | After |
|---|---|---|
| Home: expense list position at 375px | about 1,434px down | 633px down |
| Home: page height (weekly) | about 1,888px | 1,189px |
| Home: controls under 44px | 13 kinds reported | 0 |
| Home: text nodes under 12px | 54 | 0 |
| CSS file | 164,470 bytes | 147,782 bytes |
| PWA icons | one 126 KB 2000px file used for both sizes | 8.7 KB and 27 KB, plus maskable 6.2 KB and 20 KB |
| First-load JS for signed-out `/` | not measured | 1,075,320 bytes raw, 321,697 gzip, 14 scripts |
| All JS chunks in the build | 1,698,821 raw, 463,942 gzip | 1,958,028 raw, 537,118 gzip |

The total of all chunks went up by about 73 KB gzip. I did not find out why. The first-load figure has no "before" to compare with, so the only supported claim is that the 51 KB (gzip) markdown chunk and the add-expense chunks are no longer downloaded until used.

## Open items inside the phase 1 scope

1. Not looked at by eye: dark mode, and every dialog after the first screenshot.
2. Still in the old style, only recolored by the palette remap: the expanded email review banner, the streak dialog, the install prompt, the inside of the projection and breakdown cards. They work, but their buttons are under 44px and they have not been rebuilt on the shared pieces.
3. Category colors in the breakdown chart now collapse to three hues (leaf, tangerine, neutral). Categories are still labelled by text, so nothing is lost, but the bars are harder to tell apart at a glance.
4. `min-h-11` controls measured 42px inside dialogs while the entrance animation was still scaling. Expected to be 44px at rest; not re-measured.
5. Pre-existing lint errors remain in `AiAssistantProvider.tsx` (two, not introduced here).
