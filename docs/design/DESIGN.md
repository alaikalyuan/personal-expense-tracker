# SakuTrack design direction: Warung

Chosen by the owner on 2026-11-11 after audit 001 (`docs/audits/001-initial-audit.md`).

**Design read:** a daily money notebook for Indonesian college students, in a warm paper-and-ink language.

**Dial:** ENERGY 2 / RHYTHM 2 / MOTION 2

## Identity

A warung receipt, not a bank statement. The app should feel like the notebook where you jot down what lunch cost: warm paper, dark ink, one bright stamp of color.

- **Motif:** the torn receipt edge (`.receipt-edge` in `app/globals.css`) on the day's summary card, and nowhere else.
- **Focal point:** one number per screen. On the home screen it is "Sisa hari ini" (what you can still spend today).
- **Accent:** tangerine, used for the one primary action on a screen (Add) and for attention states. Never for decoration.

## Palette

Defined once in `app/globals.css`. Use the semantic names in new code.

| Token | Light | Dark | Reason |
|---|---|---|---|
| `paper` | `#FFF8EC` | `#1A130D` | Page background. Cream paper by day, warm brown by night, never grey. |
| `card` | `#FFFFFF` | `#261D15` | Raised surfaces. One step off the paper so cards read without shadows. |
| `ink` | `#2B2118` | `#F6EBDD` | Body text. Brown-black ink is softer than pure black on cream. |
| `ink-soft` | `#6B5A48` | `#C4B29B` | Supporting text. 6.2:1 on paper, so it is safe at 12px. |
| `line` | `#EAD9BD` | `#3D3024` | Hairlines and dividers. |
| `accent` | `#E8590C` | `#F98229` | Tangerine: the single accent. Text on it is `on-accent` (`#17110B`), 5:1. |
| `accent-strong` | `#C2470A` | `#FFA65C` | Accent used as text on paper or card (4.9:1 in light). |
| `ok` | `#2F7D4F` | `#7FC596` | Leaf green, only for "within budget" and success. |
| `danger` | `#B3261E` | `#EE9085` | Brick, only for over budget and destructive actions. |

Limit: paper and ink neutrals, plus accent, ok and danger. No other hue.

**Palettes:** the table above is the default, Orange. The owner asked for more color because one palette gets dull over months of daily use, so the menu also offers Pink, Blue, Monochrome and Hybrid (`utils/theme/palette.ts`, overrides in `app/globals.css` under `[data-palette]`). Each palette swaps paper, card, ink, ink-soft, line and the accent pair, plus the zinc and amber ramps old screens use. Leaf and brick never change, so "within budget" and "over budget" mean the same color in every palette. Every pair was checked: ink-soft at least 6.2:1 on paper, text on accent at least 4.6:1. In Monochrome the accent is the ink itself.

**Hybrid** follows the local clock: Orange from 05:00 (morning sun), Blue from 11:00 (midday sky), Pink from 15:00 (dusk), Monochrome from 19:00 (night). A script in `<head>` applies it before first paint, and an open app re-checks every minute. Light or dark stays the user's own choice.

**Legacy remap:** older screens still use Tailwind color class names (`bg-emerald-500`, `text-pink-600` and so on). `app/globals.css` points every one of those families at a Warung ramp, so no screen can render an off-palette color. When a screen is redesigned, replace those class names with the semantic ones. The remap is a bridge, not the destination.

## Typography

- **Typeface:** Plus Jakarta Sans. It was drawn for the city of Jakarta, has friendly round forms, and has clear tabular figures for Rupiah amounts.
- **Numbers:** `tabular-nums` everywhere so amounts line up in lists.
- **Minimum size:** 12px for any text. Inputs are 16px on touch devices so the page never zooms on focus and pinch zoom can stay enabled.
- **No** uppercase wide-tracked labels. Section labels are sentence case, 12 to 13px, `ink-soft`.

## Shape and depth

- **Radius:** 16px for cards, 12px for controls, full round only for the Add button and avatars. Pills are not the default.
- **Shadow:** none on cards (the paper and card contrast does the work). One soft shadow on the bottom bar, because it floats over scrolling content.
- **Blur:** none.

## Icons

- Lucide stays as the icon set because it is already a dependency and replacing it adds weight for no user benefit. The rule is relevance: an icon must name the thing it sits next to (house for Beranda, people for Patungan, piggy bank for Tabungan, chat bubble for the assistant).
- No sparkle, star or lightning icons. The assistant is a chat bubble because it opens a chat.
- Icons are `ink-soft` by default. An icon takes the accent only when the row needs attention.
- No arrows on buttons. A chevron appears only on rows that navigate or expand.

## Motion (dial 2)

- Dialogs fade and rise in 240ms. Progress bars animate once on load.
- All of it stops under `prefers-reduced-motion`.
- No looping or decorative animation.

## Layout rules

- One column, max width 448px, 16px side gutter.
- Home screen order: date and greeting, the day's summary (focal), notices as single lines, today's expenses, then insights.
- Bottom bar: Beranda, Patungan, Tambah (center, accent), Tabungan or Saku, Bandingkan. Settings live in the account menu.
- Every tappable control is at least 44px tall.
- Every dialog uses `app/ui/Dialog.tsx` (Escape, focus trap, focus return, labelled).
- Every form field uses `app/ui/Field.tsx` so the label is always visible and connected.

## Voice

Bahasa Indonesia first, casual and short, the way a friend would say it. "Sisa hari ini", "Aman", "Catat". No finance jargon, no vendor names, no exclamation marks on system copy.

## Assets

The existing logo artwork is kept. It is only resized into correct icon files. No new logo, illustration or avatar is created without the owner asking for it.
