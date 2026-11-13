# Responsive checklist

Run this on every route and every major dialog. Mark each item `PASS / FAIL / PARTIAL / N/A / UNVERIFIED`. Standards and status rules are in `AUDIT_STANDARDS.md`.

## Viewport matrix

These are recommended test viewports, not industry breakpoints. Test real behaviour at each size; don't assume a device category from the width alone.

| Category | CSS viewport | Orientation | Minimum evidence |
|---|---:|---|---|
| Small mobile | 320 × 640 | Portrait | Overflow check, viewport screenshot (also the WCAG 1.4.10 reflow width) |
| Standard mobile | 375 × 812 | Portrait | Full-page screenshot, light and dark |
| Large mobile | 430 × 932 | Portrait | Overflow check, viewport screenshot |
| Small tablet | 768 × 1024 | Portrait | Overflow check, screenshot |
| Large tablet | 1024 × 768 / 1024 × 1366 | Landscape / portrait | Overflow check, screenshot |
| Desktop | 1280 × 800 | Landscape | Full-page screenshot, light and dark |
| Wide desktop | 1440 × 900 | Landscape | Overflow check, screenshot |
| Keyboard-open proxy | 375 × 500 | Portrait | Every dialog: primary action reachable |

Also test: 200% browser zoom (≈ 640 px wide at 1280), WCAG 1.4.12 text-spacing override, resizing while a dialog or menu is open, safe-area insets on a real notched device, and an on-screen keyboard on a real device. Simulated keyboards are only a proxy.

## Checklist

- [ ] No unintended horizontal page scrolling (`documentElement.scrollWidth ≤ clientWidth`).
- [ ] No clipped, overlapping or unreachable content.
- [ ] Text wraps without collisions. Long names and Rp 99.999.999 amounts fit.
- [ ] Primary actions stay visible and reachable.
- [ ] Fixed bottom bar and Add button don't cover the last item when scrolled to the end.
- [ ] Focused elements are never hidden under fixed bars (WCAG 2.4.11).
- [ ] Dialogs fit the viewport and scroll internally on short screens.
- [ ] Forms stay usable with the on-screen keyboard open.
- [ ] Tables, charts and dense data have an intentional narrow-screen treatment.
- [ ] Tablet and desktop layouts are deliberate (DESIGN.md: one 448px column), not an accident.
- [ ] Portrait and landscape tablet layouts are both usable.
- [ ] Zoom and text enlargement don't remove functionality.
- [ ] Safe-area padding is respected (`env(safe-area-inset-*)`, `viewport-fit=cover`).
- [ ] Large datasets (hundreds of rows, six months) stay usable: list length, archive height, search.

## Tooling

The Audit 002 scripts are in `docs/audits/evidence/002/scripts/`. `lib.mjs` provides `overflow(page)` (scroll width and offending elements), `targets(page)` (rendered control sizes) and `VIEWPORTS`.
