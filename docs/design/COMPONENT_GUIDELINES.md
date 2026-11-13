# SakuTrack shared components (as built)

Recorded during Audit 002 (2026-11-13), code at commit `a66510c` (master). Documents what the code does today; limitations are read from source, not tested in a browser. `DESIGN.md:73-74` states every dialog uses `Dialog.tsx` and every form field uses `Field.tsx`; the inventory in section 6 shows the actual spread.

Shared components live in `app/ui/` (4 files, all read in full) plus `app/BottomNav.tsx`. There is **no shared Toast, Alert, Badge, Card, Skeleton or Input-group component** (see section 5).

## 1. `app/ui/Dialog.tsx` (133 lines)

**Purpose**: "The one dialog shell for the app" (`Dialog.tsx:25-31` comment). Portalled bottom-sheet on phones, centred card from `sm:`.

| Prop | Type | Notes |
|---|---|---|
| `isOpen` | boolean | returns `null` when false (`:62`) |
| `onClose` | `() => void` | |
| `title` | string | rendered in `<h2 id=useId() class="text-base font-bold">` (`:108`) |
| `description` | string? | `<p>` linked by `aria-describedby` only when provided (`:102`) |
| `closeLabel` | string | required, "already translated"; becomes close button `aria-label` (`:123`) |
| `busy` | boolean = false | blocks Escape, backdrop click, and disables close button |
| `children` | node | scroll region `overflow-y-auto px-5 py-4` (`:127`) |
| `footer` | node? | `flex gap-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]` (`:128`) |

Built-in behaviour (line numbers are the real file lines):

| Behaviour | Implementation |
|---|---|
| Portal | `createPortal(..., document.body)` so ancestors with filter/mask/transform (receipt card) cannot trap `fixed` (`:31-33,131-132`) |
| Role/labels | `role="dialog" aria-modal="true" aria-labelledby={titleId}` `tabIndex={-1}` on the panel (`:99-104`) |
| Initial focus | first `[data-autofocus]` element, else first focusable, else the panel (`:50-52`); `MoneyField autoFocus` emits `data-autofocus` (`Field.tsx:134`) |
| Focus return | opener captured from `document.activeElement` on open; `opener.focus()` in effect cleanup (`:48,58`) |
| Escape | on the overlay's `onKeyDown`; `stopPropagation()` then `onClose()`; ignored while `busy` (`:65-69`). Only fires while focus is inside the overlay |
| Focus trap | Tab/Shift+Tab wraps first/last of `FOCUSABLE` filtered by `offsetParent !== null` (`:70-87`) |
| Backdrop | `onMouseDown` closes only when `e.target === e.currentTarget` and not busy (`:92-94`) |
| Scroll lock | `document.body.style.overflow = "hidden"`, previous value restored (`:54-57`) |
| Size | `max-h-[92dvh] w-full max-w-md`; `rounded-t-2xl sm:rounded-2xl`; `border-line bg-card text-ink` (`:104`) |
| Backdrop style | `z-50 bg-zinc-950/60 animate-fade-in`; panel `animate-modal-in` (`:91,104`) |
| Close button | 44x44 (`h-11 w-11`), `X` icon `aria-hidden`, raw `<button>` not `Button` (`:117-125`) |

Limitations visible in code:
- No `inert`/`aria-hidden` on the rest of the page; trap relies on the keydown handler alone (focus can leave via mouse or a screen-reader virtual cursor).
- `FOCUSABLE` selector includes `[tabindex]:not([tabindex="-1"])` but not `input[type=hidden]` exclusion (hidden inputs have `offsetParent === null`, so they are filtered at Tab time but could be picked by the initial-focus query).
- Two stacked Dialogs both set `body.style.overflow` and restore in mount order; nested restore order is not guarded.
- `title` and `description` are plain strings (no node content); no size prop (always `max-w-md`); no non-dismissable mode other than `busy`.
- Backdrop scrim is a raw utility colour (`bg-zinc-950/60`), not a token.

## 2. `app/ui/ModalOverlay.tsx` (103 lines)

**Purpose**: stop-gap "drop-in replacement for the `<div className="fixed inset-0 ...">` backdrop used by the older modals" (`:7-15` comment). Says "New dialogs should use `Dialog.tsx` instead".

API: `HTMLAttributes<HTMLDivElement>` only (`className`, `children`, `onMouseDown`, `onKeyDown`, `aria-*`, `role`...). No `isOpen`, no `title`, no `busy`. Caller supplies all layout/z-index classes (see section 6 for the 6 different class strings in use).

| Behaviour | Implementation |
|---|---|
| Role | `role="dialog" aria-modal="true" tabIndex={-1}` on the **backdrop element itself**, props spread after, so caller props can override (`:90-101`) |
| Accessible name | if no `aria-labelledby`/`aria-label`, takes the first `h1,h2,h3` in the overlay, assigns an id if missing, sets `aria-labelledby` (mount-time only) (`:24-29`) |
| Initial focus | focuses the overlay root unless focus is already inside (`:33-35`) |
| Focus return | `opener.focus()` on unmount if still in DOM (`:37-39`) |
| Escape | clicks the first `button` containing `svg.lucide-x` that is not inside `li`/`label` and is not disabled; if none, calls caller's `onMouseDown` with a synthetic `{target: el, currentTarget: el}` (backdrop tap) (`:45-58,66-69`) |
| Focus trap | same as Dialog, also treats the root as "first" for Shift+Tab; excludes `input[type=hidden]` (`:60-88`) |
| Caller keydown | `onKeyDown?.(e)` runs first; `defaultPrevented` short-circuits (`:61-62`) |

Limitations visible in code:
- Escape depends on a Lucide `X` icon class (`svg.lucide-x`) and DOM order; a modal without that icon relies on its backdrop `onMouseDown` doing a close (some do not provide one).
- Name is only computed once on mount: headings that appear later, or modals with no h1-h3, get no accessible name.
- No portal and no scroll lock (an ancestor transform/filter would clip `fixed`; the body can still scroll behind).
- Overlay `onMouseDown` for backdrop-close is the caller's responsibility (no click-target check inside).

## 3. `app/ui/Field.tsx` (142 lines)

Exports: `CONTROL_CLASS`, `FieldShell`, `TextField`, `SelectField`, `MoneyField`.

`CONTROL_CLASS` (`:6`): `min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink placeholder:text-ink-soft/70 hover:border-ink-soft disabled:opacity-50`.

| Component | Props | Built-in behaviour |
|---|---|---|
| `FieldShell` (`:17-47`) | `label`, `hint?`, `error?`, render-prop `children({id, describedBy})` | `useId()` id; `<label htmlFor={id} class="text-sm font-semibold text-ink">` always visible (`:25`); hint `<p id=...-hint class="text-xs text-ink-soft">` hidden when an error shows (`:29`); error `<p id=...-error role="alert" class="text-xs font-medium text-danger">` (`:34`); `aria-describedby` = ids of hint and/or error |
| `TextField` (`:49-69`) | `InputHTMLAttributes` minus `id`, + `label`, `hint`, `error`, `className` | sets `id`, `aria-describedby`, `aria-invalid={error ? true : undefined}`; `CONTROL_CLASS` + className |
| `SelectField` (`:71-84`) | `SelectHTMLAttributes` minus `id`, + same | sets `id`, `aria-describedby`; **no `aria-invalid`** |
| `MoneyField` (`:100-140`) | `label, hint, error, value (digits string), onChange(digits), name?, prefix="Rp", placeholder="0", required, autoFocus, disabled` | `type="text" inputMode="numeric" autoComplete="off"`; strips non-digits and leading zeros (`:130`); display via `Number(value).toLocaleString("id-ID")` (`:113`); decorative `Rp` prefix `aria-hidden`; hidden `<input name value>` for form submit (`:137`); `data-autofocus` for Dialog; control `pl-11 text-lg font-bold` |

Limitations visible in code:
- No `textarea`, checkbox, radio, switch, date, or search field; no required marker (the `required` prop only reaches `MoneyField`'s input; text/select receive it via `...rest`, but there is no visible indicator).
- `MoneyField` is integer-only and hard-wired to `id-ID` grouping and `Rp` default; `QuickAddExpense` implements its own currency input (`QuickAddExpense.tsx:1130`) with decimal support.
- `MoneyField` does not forward `min`, `max`, `onBlur`, `aria-*` or `ref`.
- `Number(value)` loses precision beyond 2^53.
- Error `role="alert"` is rendered as a conditional element (announces on insertion).

## 4. `app/ui/Button.tsx` (36 lines)

Props: `ButtonHTMLAttributes` + `variant?: "primary" | "secondary" | "danger" | "ghost"` (default `secondary`), `block?: boolean` (default false). Default `type="button"` (`:24`). Server-safe (no `"use client"`).

Base classes (`:30`): `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50`; `block` adds `flex-1` (not `w-full`).

| Variant | Classes (`:12-16`) |
|---|---|
| primary | `bg-accent text-on-accent hover:brightness-95 active:brightness-90` |
| secondary | `border border-line bg-card text-ink hover:bg-paper active:bg-line` |
| danger | `border border-danger text-danger hover:bg-danger-soft active:bg-danger-soft` |
| ghost | `text-ink-soft hover:bg-paper hover:text-ink active:bg-line` |

Limitations: no size prop (single 44px height), no `loading`/pending state or `aria-busy`, no icon slot, no `asChild`/link variant (links are hand-styled), `disabled:opacity-50` only (cursor handled globally, `globals.css:439-444`). Focus ring comes from the global `:focus-visible` rule, not the component.

## 5. Navigation, toasts and status

### `app/BottomNav.tsx` (100 lines, client)
- Purpose: fixed 5-slot bar: Beranda `/`, Patungan `/split`, centre Add (accent), Tabungan `/savings` or Saku `/saku` (multi-saku flag), Bandingkan `/compare` (`:36-49`).
- Props: `initialMultiSaku?: boolean = false`, `signedIn?: boolean = true` (`:16-20`). Rendered once from `layout.tsx` for all routes.
- Hidden (returns `null`) when signed out, on `/login`, and on any `/split/*` detail route (`:30-34`).
- Semantics: `<nav aria-label={t.home.navLabel}>` (`:59`); `<ul>` with `grid-cols-5`; links carry `aria-current="page"` when active (`:81`); icons `aria-hidden`; labels `text-xs` single line with `truncate`.
- Sizes: links `min-h-14` (56px); Add button `h-14 w-14 rounded-full border-4 border-card bg-accent text-on-accent` with `aria-label={t.nav.addExpense}` (`:66-73`); bar `fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]` and hard-coded `shadow-[0_-4px_16px_rgb(43_33_24/0.06)]` (`:60`); inner `max-w-md`.
- Add flow: `QuickAddModal` is `dynamic(..., {ssr:false})`, preloaded on `onPointerEnter`/`onFocus` (`:13-15,68-70`), mounted after first tap (`addLoaded`).
- Limitations: active state differs only by weight/colour + stroke width; no focus-return handling here (delegated to ModalOverlay inside QuickAdd); pages must reserve space themselves (`pb-24`/`pb-28`, 7 uses); no side safe-area padding; `/split` match uses `startsWith`, so `/split/x` hides the bar entirely.

### Toasts and status messages
No shared component; each screen builds its own. All strings translated via `t.*`.

| Location | Markup | a11y | Auto-dismiss |
|---|---|---|---|
| `app/DashboardClient.tsx:654-672` | container `pointer-events-none fixed inset-x-0 bottom-24 z-50`; ok toasts `bg-ink text-card`; error `bg-danger text-card` | container `aria-live="polite"`; error `<p role="alert">` | 4500ms (`:127-142`, `:386`, `:392`) |
| `app/savings/SavingsClient.tsx:589-596` | `fixed inset-x-4 bottom-24 z-[70] ... bg-danger text-card` | `role="alert"` | none seen in this block |
| `app/TrackingStreak.tsx:247-251` | `absolute inset-x-4 bottom-4 ... bg-zinc-900 text-white dark:bg-zinc-100` | none | 3000ms (`:49`) |
| `app/QuickAddExpense.tsx:859-868` | inline box `border-emerald-200 bg-emerald-50 ... text-emerald-700` | none | persistent while `batchFeedback` set |
| `app/ai/AiAssistantSheet.tsx:599-603` | inline `text-teal-600` `Check` + text | none | 3000ms (`:133,140`) |
| `app/email-sync/EmailSyncSettingsModal.tsx:237,258,366,511` | `<p role="status">` ok/danger text colour; spinner wrapper `role="status"` | `role="status"` | n/a |
| `app/ExpenseList.tsx:431,436` | `rounded-xl border border-danger bg-danger-soft p-3 text-danger` | `role="alert"` | n/a |

Counts: `role="alert"|"status"` 9 total in `app/`; `aria-live` 2 (`DashboardClient.tsx:654`, `ExpenseList.tsx:372`).

Other status surfaces: `app/loading.tsx` (skeleton blocks `bg-line`, `aria-busy="true"`, `aria-label="Memuat / Loading"` hard-coded, `motion-safe:animate-pulse`), `app/error.tsx` (hand-styled primary/secondary buttons duplicating Button classes, `error.tsx:28,34`), `app/not-found.tsx`, `app/InstallPrompt.tsx` (dismiss `aria-label` `:98`).

## 6. Usage inventory

### Dialog vs ModalOverlay vs hand-rolled

| Mechanism | Files | Instances | Where |
|---|---|---|---|
| `Dialog` (`ui/Dialog`) | 4 | 4 | `BudgetEditDialog.tsx:99`, `email-sync/EmailSyncSettingsModal.tsx:249`, `ExpenseList.tsx:394`, `UserMenu.tsx:239` |
| `ModalOverlay` | 16 | 21 | `ai/ImageUploadModal.tsx:491`, `email-sync/PendingTransactionsBanner.tsx:201`, `ExportShareModal.tsx:293`, `NotificationSettingsModal.tsx:156`, `QuickAddExpense.tsx:782`, `saku/IncomeModal.tsx:70`, `saku/SakuFormModal.tsx:109`, `saku/TransferModal.tsx:79`, `savings/SavingsClient.tsx:599,690,819,882,1018`, `split/new/FriendViewPreviewModal.tsx:71`, `split/new/SplitBillCreator.tsx:1570`, `split/SplitBillHistoryClient.tsx:493`, `split/[id]/SplitBillViewer.tsx:518,564`, `subscriptions/SubscriptionsClient.tsx:764`, `TrackingStreak.tsx:83`, `UpgradeAccountModal.tsx:139` |
| Hand-rolled `fixed inset-0` | 1 | 1 | `ai/AiAssistantSheet.tsx:281` (own `role="dialog" aria-modal aria-labelledby` `:278-280`; Escape via `window` keydown listener `:117-124`; no focus trap, no focus move/return, no scroll lock) |

Backdrop class strings passed to `ModalOverlay` vary: `bg-black/60` (14 uses), `bg-zinc-950/60`, `bg-zinc-950/70`, `bg-black/75`; alignment `items-center` vs `items-end sm:items-center`; z-index `z-50` (all but `ImageUploadModal.tsx:491` `z-[60]`). Four files (`FriendViewPreviewModal.tsx:72`, `SplitBillHistoryClient.tsx:494`, `SplitBillViewer.tsx:519,565`) also pass `role="dialog" aria-modal="true"` themselves (duplicates the component's own). Inner panels in `SavingsClient.tsx` use `bg-white dark:bg-zinc-900` and `animate-scale-in` (no such class defined, `globals.css`).

Other fixed layers that are not dialogs: `QuickAddExpense.tsx:1943` FAB (`fixed bottom-6 right-6 z-10 ... bg-zinc-900`), `SplitBillCreator.tsx:1503` action bar.

### Form controls vs `Field`

`TextField`/`SelectField`/`MoneyField`/`FieldShell` are used in 3 files only: `BudgetEditDialog.tsx` (1), `EmailSyncSettingsModal.tsx` (2), `ExpenseList.tsx` (6). 

Raw `<input>`/`<select>`/`<textarea>` outside `Field.tsx`: **87** (71 input, 14 select, 2 textarea) in 21 files. Script: `docs/audits/evidence/002/scripts/audit_inputs.js` (heuristic parse of each tag; "labelled" = has `aria-label`/`aria-labelledby`, or sits inside an unclosed `<label>`, or has an `id`; hidden inputs excluded).

| Result | Count |
|---|---|
| Labelled via `aria-label(ledby)` | 2 |
| Labelled via wrapping `<label>` | 8 |
| Has `id` only (htmlFor match not verified; `htmlFor` appears 5 times outside `ui/`) | 6 |
| `type="hidden"` (n/a) | 2 |
| **No programmatic label found** | **69** |

Typical pattern (not associated): `<label className="text-xs ...">text</label>` followed by a sibling `<input>` with neither `id` nor `htmlFor` (`savings/SavingsClient.tsx:637-646`, `saku/IncomeModal.tsx:117-124`, `split/new/SplitBillCreator.tsx:694-700`). `<label` elements outside `ui/`: 58; `htmlFor`: 5. Placeholder-only: `archive/ArchiveWeekList.tsx:94` (search), `QuickAddExpense.tsx:1130` (amount; visually preceded by currency symbol span).

Unlabelled counts by file (heuristic): `QuickAddExpense.tsx` 13 (lines 946, 988, 1130, 1234, 1291, 1311, 1499, 1683, 1741, 1835, 1842, 1853, 1864), `SplitBillCreator.tsx` 13 (697, 857, 1006, 1045, 1173, 1196, 1221, 1242, 1335, 1348, 1388, 1400, 1416), `SubscriptionsClient.tsx` 8 (811, 827, 842, 860, 872, 891, 940, 956), `SavingsClient.tsx` 7 (641, 655, 759, 847, 909, 1067, 1083), `SakuFormModal.tsx` 5 (209, 271, 296, 310, 324), `TransferModal.tsx` 5 (112, 129, 148, 165, 179), `NotificationSettingsModal.tsx` 4 (267, 285, 306, 324), `IncomeModal.tsx` 4 (102, 120, 137, 163), `AiAssistantSheet.tsx` 3 (575 password, 863 file, 887 textarea), `ImageUploadModal.tsx` 2 (767, 775 file), `PendingTransactionsBanner.tsx` 2 (248, 266 select), `ActionProposalCard.tsx:141`, `ArchiveWeekList.tsx:94`, `SplitBillHistoryClient.tsx:318`. Control types in the 87: text 21, number 18, select 14, checkbox 14, date 5, file 3, radio 3, password 2, textarea 2, hidden 2, others 3.

Raw controls also carry their own class strings (e.g. `rounded-2xl border-2 border-zinc-200 bg-zinc-50/70` at `QuickAddExpense.tsx:1126`) instead of `CONTROL_CLASS`; `focus:outline-none|hidden` appears 34 times and `focus:ring-*` 78 times in old screens.

### Buttons vs `Button`

| Metric | Count |
|---|---|
| `<Button>` uses | 16, in 3 files: `EmailSyncSettingsModal.tsx` 9, `ExpenseList.tsx` 5, `BudgetEditDialog.tsx` 2 |
| Raw `<button` (outside `ui/Button.tsx`) | 283 in ~40 files |
| Largest raw-button files | `QuickAddExpense.tsx` 47, `savings/SavingsClient.tsx` 34, `split/new/SplitBillCreator.tsx` 24, `subscriptions/SubscriptionsClient.tsx` 18, `ai/ImageUploadModal.tsx` 17, `ai/AiAssistantSheet.tsx` 14, `split/[id]/SplitBillViewer.tsx` 10, `UserMenu.tsx` 10, `ExpenseList.tsx` 9 |
| Hand-copied Button styling | `error.tsx:28,34` (primary/secondary classes identical in intent); `Dialog.tsx:117` close button |
| Sizing | `h-8|h-9|h-10` classes 43; `min-h-11` 45; `h-11` 19 (44px) |

## 7. Gaps between DESIGN.md and code (components)

| # | DESIGN.md | Code |
|---|---|---|
| 1 | "Every dialog uses `app/ui/Dialog.tsx` (Escape, focus trap, focus return, labelled)" (`:73`) | 4 files use Dialog; 16 use ModalOverlay (21); 1 is hand-rolled without focus trap/return |
| 2 | "Every form field uses `app/ui/Field.tsx` so the label is always visible and connected" (`:74`) | Field in 3 files; 69 of 87 raw controls have no programmatic label found |
| 3 | "Every tappable control is at least 44px tall" (`:72`) | Button/Field/Dialog close/nav satisfy it; 283 raw buttons depend on the coarse-pointer `::after` hit area (`globals.css:517-545`); inputs/checkboxes not covered by that rule |
| 4 | "Dialogs fade and rise in 240ms" (`:63`) | Dialog/ModalOverlay users: yes via `animate-fade-in` (200ms backdrop) and `animate-modal-in` (240ms) on Dialog only; ModalOverlay users animate only the backdrop and the five `SavingsClient` panels use an undefined `animate-scale-in` |
| 5 | Bottom bar "one soft shadow" (`:51`), order of items (`:71`) | Matches (order and shadow present); shadow colour hard-coded (`BottomNav.tsx:60`) |
| 6 | "No arrows on buttons... Lucide icons relevant" (`:56-59`) | Not audited here |
| 7 | Toast/status behaviour not specified in DESIGN.md | 7 independent implementations, 3 of them without a live-region role |

## 8. Recommendations (not yet adopted)

- Pick one overlay primitive; migrating the 16 ModalOverlay files to `Dialog` would remove the `svg.lucide-x` Escape lookup.
- Give hand-rolled raw controls an `id`/`htmlFor` or move them to `TextField`/`SelectField`; add `aria-invalid` to `SelectField`.
- Extract one `Toast` (live-region `status`/`alert`, one dismiss duration) from the DashboardClient pattern.
