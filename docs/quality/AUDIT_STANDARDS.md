# SakuTrack audit standards

The references SakuTrack audits are measured against, and how much weight each one carries. First written for Audit 002 (2026-11-13). Update the "consulted" column whenever a source changes.

## 1. Reference hierarchy

| # | Reference | Version / date consulted | Role in an audit | Binding? |
|---|---|---|---|---|
| 1 | WCAG 2.2, Level AA (https://www.w3.org/TR/WCAG22/) | W3C Recommendation, 12 December 2024. Consulted 2026-11-13 | Accessibility conformance target for web content | **Formal requirement.** SakuTrack's target level |
| 2 | WAI-ARIA Authoring Practices Guide (https://www.w3.org/WAI/ARIA/apg/) | Living document. Consulted 2026-11-13 | Expected keyboard and focus behaviour for dialogs, tabs, menus, disclosures, comboboxes | Guidance. A deviation counts as a defect only when it breaks a WCAG criterion or a user task |
| 3 | Nielsen Norman Group, 10 Usability Heuristics (https://www.nngroup.com/articles/ten-usability-heuristics/) | Published 1994, last reviewed 30 January 2024. Consulted 2026-11-13 | Structured usability evaluation | Heuristic, not compliance. Each finding has to name a user impact |
| 4 | Core Web Vitals (https://web.dev/articles/vitals) | Last updated 31 October 2024. Consulted 2026-11-13 | Performance thresholds | Google's "Good" thresholds, used as SakuTrack's internal target |
| 5 | Apple Human Interface Guidelines, Material Design 3 | Living documents | Touch, layout, safe-area and component conventions | Advisory only. Never cited as a web compliance rule |
| 6 | `docs/design/DESIGN.md` (Warung) | Owner-approved 2026-11-11 | Internal design intent: palette, type, radius, voice, 44px targets | **Internal requirement** for SakuTrack. Not an external standard |
| 7 | Antislop rules (`antislop` skills, R-xx IDs) | As used in Audit 001 | Visual-quality heuristics used in Audit 001 | Internal. Kept only so Audit 001 can be compared |

## 2. Formal requirements vs internal targets

Keep the two apart in every finding. A failure against an internal target is never reported as a WCAG failure.

| Topic | Formal (WCAG 2.2 AA) | SakuTrack internal target |
|---|---|---|
| Text contrast | 4.5:1 normal, 3:1 large (≥ 24px, or ≥ 18.66px bold), SC 1.4.3 | Same. `ink-soft` must hold 4.5:1 on both `paper` and `card` in every palette |
| Non-text contrast | 3:1 for UI component boundaries, states and meaningful graphics, SC 1.4.11 | Same |
| Target size | **24 × 24 CSS px** minimum, or enough spacing, with the spacing/equivalent/inline/user-agent/essential exceptions, SC 2.5.8 | **44 × 44 CSS px** for primary touch controls (DESIGN.md "Layout rules") |
| Minimum text size | None | 12px for any text. 16px inputs on touch devices |
| Focus | Visible focus (2.4.7) and focus not obscured, minimum (2.4.11) | Same, plus a consistent global `:focus-visible` ring |
| Dialogs | Name, role, value (4.1.2); focus order (2.4.3); no keyboard trap (2.1.2) | Every dialog uses `app/ui/Dialog.tsx`/`ModalOverlay.tsx`: Escape closes, focus is trapped, focus returns to the opener |
| Motion | 2.3.3 is AAA (not required). 2.2.2 pause/stop/hide applies to auto-moving content | Everything respects `prefers-reduced-motion` (DESIGN.md "Motion") |
| Reflow and zoom | 320 CSS px width without 2-D scrolling (1.4.10). 200% text resize (1.4.4). Text spacing (1.4.12) | Same |
| Performance | No formal requirement | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 field data. Lab data is reported separately |
| Language and voice | `lang` set (3.1.1) | Bahasa Indonesia first, no exclamation marks in system copy, no em dash in UI copy |

## 3. Evidence and confidence

| Label | Meaning |
|---|---|
| Verified live | Reproduced in the running application by the lead auditor |
| Verified in code | Confirmed in source (`path:line`), not necessarily reproduced live |
| Agent-reported | Reported by a subagent and not re-checked by the lead auditor |
| Unverified | Plausible, still needs confirmation |

An agent-reported issue is never presented as a verified defect.

## 4. Status vocabulary

`PASS` tested and met. `FAIL` tested and not met. `PARTIAL` some relevant cases pass. `N/A` does not apply (say why). `UNVERIFIED` not tested or not enough evidence.

Pass rates exclude N/A and UNVERIFIED from the denominator, but the UNVERIFIED count is always shown next to the rate.

## 5. Priority

| Priority | Definition |
|---|---|
| P0 Critical | Security or privacy exposure, or data loss or corruption |
| P1 High | Core workflow broken, materially misleading financial information, or a serious accessibility barrier |
| P2 Medium | Significant friction or a degraded experience that has a workaround |
| P3 Low | Minor polish or a low-impact inconsistency |

Priority reflects user impact and likelihood, not how easy or interesting the fix is.

## 6. Verdict scale

`BLOCKED` (an unresolved P0) · `NOT READY` (an unresolved P1 in a core workflow, trust, or essential accessibility) · `CONDITIONALLY READY` (no P0 or P1; known P2/P3 issues documented) · `READY FOR THE DEFINED SCOPE`.

The verdict is an internal release recommendation, never a claim of WCAG certification. An automated scan (axe, Lighthouse) is never described as a complete accessibility audit.
