# Accessibility checklist (WCAG 2.2 AA + APG)

Target: WCAG 2.2 Level AA (W3C Recommendation, 12 December 2024). Mark each item `PASS / FAIL / PARTIAL / N/A / UNVERIFIED` per route or dialog. An automated scan only supports this checklist and never completes it. Every audit also needs the manual keyboard, zoom/reflow and screen-reader sections.

## Structure and semantics
- [ ] Meaningful, unique `<title>` per route (2.4.2). `lang` set on `<html>` (3.1.1).
- [ ] One `h1`, and a logical heading order (1.3.1, 2.4.6).
- [ ] Landmarks: `header`, `nav`, `main` (1.3.1).
- [ ] Every control has an accessible name that includes its visible label (4.1.2, 2.5.3).
- [ ] Form labels are programmatically tied to fields with `htmlFor`/`id` or wrapping. A placeholder alone is not a label (1.3.1, 3.3.2).
- [ ] Instructions and validation messages are tied to inputs (`aria-describedby`) (1.3.1, 3.3.1).
- [ ] Decorative icons have `aria-hidden="true"`, and meaningful images have alt text (1.1.1).

## Keyboard and focus
- [ ] Every function works by keyboard (2.1.1), with no trap outside modal dialogs (2.1.2).
- [ ] Focus order is logical (2.4.3) and focus is visible (2.4.7).
- [ ] Focus is not hidden behind the fixed bottom bar or other sticky content (2.4.11).
- [ ] Composite widgets follow the APG: tabs (arrow keys, `aria-selected`), menu button, disclosure (`aria-expanded`), listbox/combobox.

## Dialog test (repeat for every dialog)

| Check | Expected (APG Dialog (Modal) pattern) |
|---|---|
| Semantics | `role="dialog"` (or `alertdialog`), `aria-modal="true"`, accessible name from the title |
| Initial focus | First field, or the least destructive control |
| Containment | Tab and Shift+Tab stay inside the dialog |
| Escape | Closes the dialog (unless that would lose data, in which case it confirms first) |
| Return | Focus goes back to the invoking control |
| Background | Inert or hidden from assistive technology while open |
| Close | A visible close button with an accessible name |
| Short screens | The whole dialog, including its primary action, is reachable at 375 × 500 |

## Visual and sensory
- [ ] Text contrast is ≥ 4.5:1 (normal) or ≥ 3:1 (large), in light and dark and in every palette: orange, pink, blue, mono, hybrid (1.4.3).
- [ ] Non-text contrast is ≥ 3:1 for input borders, focus rings, toggles and progress bars (1.4.11).
- [ ] Colour is never the only carrier of meaning, e.g. over or under budget (1.4.1).
- [ ] Content works at 320 CSS px (1.4.10), at 200% text (1.4.4) and with text-spacing overrides (1.4.12).
- [ ] `prefers-reduced-motion` stops non-essential motion, including confetti (internal rule). Nothing flashes more than 3 times a second (2.3.1).
- [ ] Pinch zoom is not disabled (no `maximum-scale=1` or `user-scalable=no`).

## Forms and status
- [ ] Required fields are identified (3.3.2).
- [ ] Errors are described in text and invalid fields have `aria-invalid` (3.3.1).
- [ ] Error messages suggest a fix (3.3.3). Financial submissions can be reviewed or reversed (3.3.4, good practice).
- [ ] Save success and failure are announced through `role="status"` or `role="alert"` (4.1.3).
- [ ] Authentication works by keyboard and screen reader, and does not rely on a cognitive test (3.3.8). A password-reset path exists.

## Target size
- [ ] WCAG 2.5.8: every target is ≥ 24 × 24 CSS px, or meets the spacing, equivalent, inline, user-agent or essential exception.
- [ ] Internal target: primary touch controls are ≥ 44 × 44 CSS px.
- [ ] Adjacent controls are far enough apart to avoid mis-taps.

## Screen reader
- [ ] At least one pairing has been tested: NVDA + Chrome or Firefox (Windows), VoiceOver + Safari (iOS/macOS), or TalkBack + Chrome (Android). Main journey: add an expense, read the budget, open and close a dialog. Record the versions. If no screen reader was available, mark this section `UNVERIFIED`.
