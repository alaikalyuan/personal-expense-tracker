# SakuTrack — Audit 002 Handoff

**Purpose:** Prepare and execute the second UI/UX, accessibility, responsive-design, and engineering-quality audit of SakuTrack.  
**Document type:** Audit handoff / execution brief  
**Status:** Ready for audit planning  
**Baseline:** `audit-001-2026-11-11.md`  
**Recommended audit ID:** `002-redesign-audit`  
**Important:** This document defines how to audit. It does not authorize code changes during the audit phase.

---

## 1. Mission

Conduct a repeatable, evidence-based audit of SakuTrack and determine whether the product has improved since Audit 001.

The audit must evaluate both:

1. **Product experience:** Can a student understand and complete important tasks easily, confidently, and efficiently?
2. **Implementation quality:** Does the application meet defined accessibility, responsive-design, interaction, reliability, and performance expectations?

Do not equate visual polish with product quality. A screen can look attractive and still fail because its calculations are misleading, its controls are inaccessible, or its save operation silently fails.

### Required outcomes

At the end of the audit, deliver:

- A concise executive verdict.
- A route-and-state coverage matrix.
- A prioritized findings register with reproducible evidence.
- Automated test results and the exact commands/configurations used.
- Screenshots or recordings for visual and interaction findings.
- A comparison against Audit 001.
- A recommended remediation sequence.
- A list of unverified areas and testing limitations.

### Audit-only rule

Do not modify application code, styles, database data, production configuration, or feature flags while collecting audit evidence. If a defect is found, document it. Fixes belong to a separate remediation phase and should be re-tested afterward.

---

## 2. Baseline from Audit 001

Audit 001 (11 November 2026) reported that the design did not pass its Antislop evaluation and documented 53 findings across accessibility, interaction, UX, visual design, clutter, PWA, and performance.

Important baseline findings included:

- Many overlays did not behave as accessible dialogs: Escape handling, focus management, and keyboard containment were inconsistent.
- Form labels were often not programmatically associated with inputs.
- Pinch zoom was restricted.
- Reduced-motion support was absent.
- Several touch targets were smaller than the audit's preferred 44 × 44 CSS px target.
- Some text and controls had insufficient contrast.
- Search was limited to today's transactions.
- The weekly comparison could compare an incomplete week with a complete week.
- Split Bill defaults could allocate items incorrectly.
- Editing a subscription could erase notes.
- The Saku feature was inaccessible because its feature flag was disabled.
- The dashboard buried the expense list below several banners and cards.
- Offline support was absent.
- Heavy UI modules were statically imported.
- Dashboard rendering involved multiple sequential server round trips.

Audit 001 also identified product strengths to preserve:

- Quick Add's natural-language entry and parsed preview.
- The budget pace line showing remaining budget and daily allowance.
- Split Bill's friend view without requiring an account.
- Clear guest-mode risk communication.
- Subscription cards showing price, renewal countdown, and the user's share.

**Audit 002 must verify the current state rather than assume any baseline issue remains present.** Reproduce each relevant issue before marking it as still open. Also inspect for regressions and newly introduced issues.

Reference: `audits/001-initial-audit.md` (or the actual repository location of Audit 001).

---

## 3. Standards and reference hierarchy

Use the following sources as the primary references. Record the version/date consulted if a standard or guideline has changed.

### 3.1 Accessibility — WCAG 2.2 Level AA

Primary reference: https://www.w3.org/TR/WCAG22/

Use WCAG 2.2 Level AA as the accessibility conformance target for applicable web content and interactions.

Key checks include:

- Text contrast: at least **4.5:1** for normal text.
- Large text contrast: at least **3:1**.
- Non-text UI components and meaningful graphical objects: generally **3:1** against adjacent colors where the criterion applies.
- Keyboard operability and visible focus.
- Meaningful focus order and focus not being obscured.
- Reflow and content usability at narrow widths and high zoom.
- Labels, instructions, error identification, and accessible names.
- Status messages that can be programmatically determined.
- Pointer target sizing under WCAG 2.2 SC 2.5.8.

**Important distinction:** WCAG 2.2 AA's target-size minimum is generally 24 × 24 CSS px, subject to defined exceptions. A 44 × 44 CSS px target is a stronger internal usability target, not the WCAG AA minimum. Use 44 × 44 CSS px as SakuTrack's preferred target for primary touch controls where practical.

Do not claim WCAG conformance based only on an automated scan. Manual keyboard, zoom/reflow, screen-reader, and interaction testing are required.

### 3.2 Accessible interaction patterns — WAI-ARIA APG

Primary reference: https://www.w3.org/WAI/ARIA/apg/

Use the Authoring Practices Guide for expected keyboard and focus behavior of patterns such as:

- Dialogs and modal dialogs.
- Tabs.
- Menus and menu buttons.
- Comboboxes and listboxes.
- Disclosure widgets.

Use native HTML elements and browser behavior wherever possible. ARIA roles and attributes do not, by themselves, make a component accessible. Test the actual interaction model.

### 3.3 Usability — Nielsen Norman Group's 10 Usability Heuristics

Primary reference: https://www.nngroup.com/articles/ten-usability-heuristics/

Evaluate screens and workflows against:

1. Visibility of system status.
2. Match between system and the real world.
3. User control and freedom.
4. Consistency and standards.
5. Error prevention.
6. Recognition rather than recall.
7. Flexibility and efficiency of use.
8. Aesthetic and minimalist design.
9. Help users recognize, diagnose, and recover from errors.
10. Help and documentation.

These are usability heuristics, not a formal compliance certification. Record the user impact and evidence for each issue.

### 3.4 Platform and responsive design guidance

**Apple Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

Use for useful guidance on touch interaction, typography, layout adaptation, safe areas, and platform conventions. Do not treat Apple-specific recommendations as universal web compliance rules.

**Material Design 3:** https://m3.material.io/

Use for component behavior, responsive layouts, navigation, typography, color systems, and interaction patterns. Adapt patterns to SakuTrack rather than copying a platform design system wholesale.

### 3.5 Performance — Core Web Vitals

Primary reference: https://web.dev/articles/vitals

Use the following “Good” thresholds, evaluated at the 75th percentile when field data is available:

| Metric | Good threshold | What it measures |
|---|---:|---|
| LCP | ≤ 2.5 seconds | Loading performance |
| INP | ≤ 200 milliseconds | Interaction responsiveness |
| CLS | ≤ 0.1 | Visual stability |

If real-user field data is unavailable, report lab measurements separately. Do not present a single Lighthouse run as proof of real-user Core Web Vitals.

### 3.6 Supporting tools

- Lighthouse: https://developer.chrome.com/docs/lighthouse
- axe-core: https://github.com/dequelabs/axe-core
- Playwright: https://playwright.dev/
- Chrome DevTools: https://developer.chrome.com/docs/devtools

Automated tools are supporting evidence, not a replacement for manual evaluation.

---

## 4. Audit scope

Inspect all relevant routes, shared components, overlays, and important states.

At minimum, revisit the surfaces covered by Audit 001:

- `/` dashboard
- Guest landing and welcome flow
- Login and signup
- Account menu
- Add expense flow, including quick add, standard entry, and photo upload if available
- AI assistant sheet
- `/savings`
- `/saku` and `/saku/[id]` if the feature is enabled or still intended to ship
- `/subscriptions`
- `/split`
- `/split/new`
- `/split/[id]`
- `/compare`
- `/archive`
- Export flow
- Email sync settings
- Notification settings
- Loading, empty, error, and not-found states

For every route, inspect applicable combinations of:

- Signed in / signed out / guest.
- Light mode / dark mode.
- Small mobile / standard mobile / large mobile.
- Tablet / desktop.
- Empty data / typical data / unusually large data.
- Slow or failed network where safe to simulate.
- Keyboard-only operation for interactive flows.

Do not create anonymous users or alter production data without explicit authorization. Prefer a dedicated test account and isolated test data.

---

## 5. Responsive viewport matrix

The following are **recommended test viewports**, not mandatory industry breakpoints. Test actual responsive behavior rather than assuming a device category from width alone.

| Category | CSS viewport | Orientation |
|---|---:|---|
| Small mobile | 320 × 640 | Portrait |
| Standard mobile | 375 × 812 | Portrait |
| Large mobile | 430 × 932 | Portrait |
| Small tablet | 768 × 1024 | Portrait and landscape |
| Large tablet | 1024 × 768 | Portrait and landscape |
| Desktop | 1280 × 800 | Landscape |
| Wide desktop | 1440 × 900 | Landscape |

Where possible, also test:

- Browser zoom at 200%.
- Text-only enlargement or platform text scaling.
- A short viewport with the on-screen keyboard open.
- Safe-area insets on supported mobile devices.
- Browser resizing while a modal or menu is open.

### Responsive checklist

- [ ] No unintended horizontal page scrolling.
- [ ] No clipped, overlapping, or unreachable content.
- [ ] Text wraps without collisions or broken controls.
- [ ] Primary actions remain visible and reachable.
- [ ] Fixed navigation and floating actions do not cover content.
- [ ] Modals fit within the available viewport and can be scrolled internally when needed.
- [ ] Forms remain usable when the on-screen keyboard is visible.
- [ ] Tables, charts, and dense data have an intentional narrow-screen treatment.
- [ ] Layout adapts to available width; it does not merely scale down a desktop layout.
- [ ] Portrait and landscape tablet layouts remain usable.
- [ ] Zoom and text enlargement do not remove functionality.
- [ ] Safe-area padding is respected where relevant.

---

## 6. Detailed audit checklists

Mark each item with one of: `PASS`, `FAIL`, `PARTIAL`, `N/A`, or `UNVERIFIED`.

### 6.1 Visual design and design-system consistency

- [ ] Each screen has a clear primary focal point.
- [ ] Visual hierarchy reflects task importance.
- [ ] Typography has a documented type scale and readable sizes.
- [ ] Color roles are tokenized (background, surface, text, border, primary, success, warning, danger).
- [ ] Color is not the only way information is communicated.
- [ ] Text and component contrast meet applicable WCAG criteria.
- [ ] Spacing follows a consistent scale.
- [ ] Component shapes, radii, borders, and shadows are consistent.
- [ ] Icons have consistent visual weight and meaningful semantics.
- [ ] Decorative effects do not compete with task content.
- [ ] Repeated components look and behave consistently across routes.
- [ ] Empty, loading, success, and error states share a coherent visual language.
- [ ] Dark and light themes are both intentionally designed and tested.
- [ ] No unexplained one-off colors, typography, or component treatments remain.

### 6.2 Usability and UX

Evaluate each important workflow using the 10 heuristics in Section 3.3.

- [ ] Users can tell what page or feature they are in.
- [ ] The system provides timely feedback after actions.
- [ ] Labels and terminology match users' understanding of personal finance.
- [ ] Navigation is predictable and consistent.
- [ ] Important actions are discoverable.
- [ ] Users can undo, cancel, edit, or recover where appropriate.
- [ ] Destructive actions are clearly identified and protected against accidental activation.
- [ ] Forms prevent invalid or contradictory input.
- [ ] Empty states explain what happened and what to do next.
- [ ] Error messages explain the problem and a useful next step.
- [ ] Loading states do not look like completed or empty results.
- [ ] Important information is visible without excessive scrolling.
- [ ] Repeated actions have efficient paths without hiding essential context.
- [ ] Financial calculations and comparisons are understandable and not misleading.
- [ ] Guest-mode limitations and data-persistence behavior are clear.

### 6.3 Accessibility — WCAG 2.2 AA

**Structure and semantics**

- [ ] Pages have meaningful titles and a logical heading hierarchy.
- [ ] Landmarks and native HTML semantics are used appropriately.
- [ ] Controls have accessible names.
- [ ] Form labels are programmatically associated with fields.
- [ ] Instructions and validation messages are associated with relevant inputs.
- [ ] Decorative images and icons are hidden from assistive technology where appropriate.
- [ ] Meaningful images have appropriate text alternatives.

**Keyboard and focus**

- [ ] Every interactive feature can be operated using a keyboard.
- [ ] Focus order is logical.
- [ ] Focus indicators are visible.
- [ ] Focus is not hidden behind sticky or fixed content.
- [ ] Dialogs move focus appropriately when opened.
- [ ] Modal dialogs contain keyboard focus while active, when required by the pattern.
- [ ] Closing a dialog returns focus to a sensible location.
- [ ] No keyboard traps exist outside intended modal behavior.
- [ ] Menus, tabs, and other composite widgets follow their documented keyboard patterns.

**Visual and sensory**

- [ ] Normal text contrast is at least 4.5:1.
- [ ] Large text contrast is at least 3:1.
- [ ] Applicable UI components and meaningful graphical objects meet 3:1 non-text contrast.
- [ ] Information is not conveyed by color alone.
- [ ] Content remains usable at 200% zoom.
- [ ] Reflow works at narrow widths without unnecessary two-dimensional scrolling.
- [ ] Motion can be reduced when the user requests reduced motion.
- [ ] No flashing content creates a seizure risk.

**Forms and status**

- [ ] Required fields are identified.
- [ ] Errors are described in text.
- [ ] Invalid fields are identifiable to assistive technology.
- [ ] Successful saves and important status changes are announced appropriately.
- [ ] Timeout or session-expiry behavior is communicated where applicable.
- [ ] Authentication and recovery flows are keyboard and screen-reader usable.

**Target size**

- [ ] Applicable WCAG 2.2 SC 2.5.8 target-size requirements are met, including exceptions where relevant.
- [ ] Primary touch controls aim for at least 44 × 44 CSS px as an internal SakuTrack target.
- [ ] Adjacent controls have enough separation to avoid accidental activation.

### 6.4 Interaction design and component behavior

**Dialogs and modals**

- [ ] Correct dialog semantics and accessible name.
- [ ] Correct initial focus.
- [ ] Correct focus containment for modal dialogs.
- [ ] Escape behavior follows the component pattern.
- [ ] Close button is visible and has an accessible name.
- [ ] Background interaction is appropriately disabled for modal dialogs.
- [ ] Focus returns to the invoking control or a sensible fallback.
- [ ] Long content is reachable on short screens.
- [ ] Destructive confirmation is clear and not overused.

**Buttons and controls**

- [ ] Buttons have a real action.
- [ ] Disabled, loading, pressed, and selected states are distinguishable.
- [ ] No essential control is hover-only.
- [ ] Clickable non-native elements support keyboard interaction and semantics, or are replaced with native controls.
- [ ] Repeated taps do not create duplicate transactions.
- [ ] Loading states prevent accidental duplicate submissions where needed.

**Forms**

- [ ] Labels remain available after a user enters a value.
- [ ] Input types and input modes are appropriate.
- [ ] Currency input accepts the intended Indonesian number format.
- [ ] Validation is clear and timely.
- [ ] Focus and error state are visible.
- [ ] Data is not silently discarded when a form is edited or cancelled.
- [ ] Successful submission has clear feedback.

### 6.5 Content and localization

- [ ] Primary interface language is consistent.
- [ ] Financial terminology is understandable to the target student audience.
- [ ] Labels are concise but unambiguous.
- [ ] Currency formatting is consistent (`Rp` and thousands separators).
- [ ] Dates, periods, and number formats are localized consistently.
- [ ] Technical implementation terms are not exposed unnecessarily.
- [ ] Empty states and error messages explain what the user can do.
- [ ] No placeholder, debug, or untranslated strings are visible.
- [ ] Copy does not imply a financial result that the underlying calculation does not support.

### 6.6 Reliability and data integrity

- [ ] Failed saves produce visible, actionable feedback.
- [ ] Successful saves persist after refresh and re-login where expected.
- [ ] Failed network requests do not masquerade as empty data.
- [ ] Retry behavior does not duplicate financial records.
- [ ] Editing preserves fields not shown in the edit form.
- [ ] Delete and destructive operations are deliberate and recoverable where appropriate.
- [ ] Totals reconcile with their underlying transactions.
- [ ] Split Bill allocations reconcile to the total.
- [ ] Budget comparisons use equivalent periods or explain their methodology.
- [ ] Exported figures match the source data and selected period.
- [ ] Guest-mode data limitations are accurately explained.
- [ ] Authentication and authorization boundaries are respected.

### 6.7 Performance and engineering quality

- [ ] Record production-build results, not only development-mode behavior.
- [ ] Record total JavaScript and CSS size.
- [ ] Record route-level first-load JS where available.
- [ ] Identify unnecessary static imports and large dependencies.
- [ ] Check whether heavy modals and feature-specific modules are loaded only when needed.
- [ ] Inspect sequential server requests and duplicate queries.
- [ ] Inspect images, fonts, and other large assets.
- [ ] Check for console errors and React warnings.
- [ ] Check for layout shifts during loading.
- [ ] Test slow network and CPU throttling.
- [ ] Measure LCP, INP, and CLS where valid measurements are available.
- [ ] Clearly distinguish lab measurements from field data.
- [ ] Do not infer performance from bundle size alone.

### 6.8 PWA and offline experience

- [ ] App can be installed where supported.
- [ ] Manifest has correct name, icons, display mode, theme color, and background color.
- [ ] Icons are appropriate sizes and include maskable assets where needed.
- [ ] Installed experience is coherent on supported platforms.
- [ ] Offline behavior is explicitly defined.
- [ ] Essential offline actions either work safely or explain why they cannot.
- [ ] Unsynced data is not silently lost.
- [ ] Sync and retry states are understandable.
- [ ] Cache behavior does not expose private data across accounts.
- [ ] Service worker updates do not leave users on an inconsistent application version.

---

## 7. Critical SakuTrack user journeys

Test these as end-to-end tasks, not isolated component checks. Use a dedicated test account and record the exact data setup.

### Journey A — First-time visitor

1. Open SakuTrack signed out in a clean browser session.
2. Inspect the initial screen and guest/login choices.
3. Read the guest-mode risk explanation.
4. Test backdrop, close, and cancel interactions.
5. Confirm that accidental taps do not create an account or submit a form.
6. Confirm that the navigation shown to signed-out users is intentional.

**Pass condition:** A new visitor understands the available choices and cannot accidentally create a guest account through an unintended backdrop interaction.

### Journey B — Record an expense

1. Open Quick Add.
2. Enter a natural-language example such as `Rp 15.000 lunch`.
3. Inspect the parsed preview.
4. Save once.
5. Verify the transaction appears exactly once and the budget updates correctly.
6. Repeat using the standard form.
7. Test invalid amounts, blank fields, and cancellation.

**Pass condition:** The user can record a valid expense quickly, understand what will be saved, and recover from invalid input without silent failure or duplicate records.

### Journey C — Find an older expense

1. Create or use transactions across multiple dates.
2. Search for a transaction that is not from today.
3. Change the selected period or filter.
4. Reset the search and confirm the expected list returns.

**Pass condition:** Search behavior matches the selected scope and is clearly communicated.

### Journey D — Understand the budget

1. Set a budget and create transactions across multiple days.
2. Inspect remaining budget and daily allowance.
3. Compare periods of unequal completion.
4. Verify that headlines do not compare a partial period against a complete period without normalization or explanation.

**Pass condition:** Budget and comparison figures are mathematically correct, traceable, and not misleading.

### Journey E — Split a bill

1. Create a bill with multiple items.
2. Add participants.
3. Assign items to participants.
4. Add or remove a participant.
5. Inspect every person's share and the total.
6. Open the friend view without an account.
7. Test QR and copy/share behavior, including failure cases where feasible.

**Pass condition:** Each allocation is explicit, totals reconcile, and no item is silently assigned to the wrong person.

### Journey F — Edit a subscription

1. Create a subscription with notes.
2. Edit its price or renewal date.
3. Save.
4. Reopen it and verify that notes and other untouched fields remain intact.

**Pass condition:** Editing one field does not erase unrelated data.

### Journey G — Failure and recovery

1. Simulate a failed request or offline state in a safe test environment.
2. Attempt to save an expense or savings change.
3. Inspect loading, error, and retry behavior.
4. Restore connectivity and retry.
5. Verify persistence and check for duplicate records.

**Pass condition:** The user receives honest feedback and can recover without losing or duplicating data.

### Journey H — Keyboard and assistive technology

1. Navigate the main workflow using keyboard only.
2. Open and close each important dialog.
3. Inspect focus order and visible focus.
4. Test forms and validation.
5. Use at least one screen reader/browser combination if available.

**Pass condition:** Important tasks can be completed without a pointer and the interface communicates structure and status appropriately.

---

## 8. Test environment and evidence requirements

Record these details in the audit report:

| Item | Required record |
|---|---|
| Commit | Exact Git commit SHA |
| Branch | Branch name |
| Build | Build command and result |
| Browser | Name and version |
| OS | Name and version |
| Viewport | Width × height in CSS px |
| Pixel ratio | Device pixel ratio, if relevant |
| Theme | Light or dark |
| Auth state | Signed in, signed out, or guest |
| Data state | Empty, typical, or large dataset |
| Network | Normal, throttled, offline, or simulated failure |
| Tools | Versions and configuration |
| Date | Audit date and timezone |

### Evidence rules

Every finding should include as many of the following as applicable:

- Screenshot or short recording.
- Route and exact reproduction steps.
- Test account/data state (never include credentials or secrets).
- Expected behavior.
- Actual behavior.
- Relevant console or network evidence.
- Source file and line reference, if confirmed by code inspection.
- Whether the issue was reproduced live, confirmed in code, or only reported by an agent.

Do not publish personal financial data, tokens, session cookies, email addresses, or other secrets in audit evidence. Use synthetic data.

### Evidence confidence

Use one of these labels:

- **Verified live:** Reproduced in the running application.
- **Verified in code:** Confirmed by source inspection, but not necessarily reproduced live.
- **Agent-reported:** Reported by a subagent and not independently checked.
- **Unverified:** Plausible finding that still needs confirmation.

Do not present an agent-reported issue as a verified defect.

---

## 9. Finding format and prioritization

Use this template for every finding:

```md
## [AUDIT-ID] Short descriptive title

- Status: FAIL
- Priority: P1
- Category: Accessibility / UX / Responsive / Reliability / Performance
- Confidence: Verified live
- Route:
- Viewport:
- Theme:
- Auth state:

### Expected behavior
What should happen, based on the cited criterion or product requirement?

### Actual behavior
What happened during the test?

### Reproduction steps
1.
2.
3.

### User impact
Who is affected, and what task is blocked or made harder?

### Evidence
- Screenshot/recording:
- Console/network:
- Source reference:

### Acceptance criteria
- [ ] Observable condition 1
- [ ] Observable condition 2

### Reference
Relevant WCAG success criterion, APG pattern, heuristic, platform guidance, or internal requirement.
```

### Priority definitions

| Priority | Definition | Typical examples |
|---|---|---|
| P0 — Critical | Security/privacy exposure, data loss/corruption, or severe issue affecting core use | Private data exposure; transactions lost |
| P1 — High | Core workflow broken, materially misleading financial information, or serious accessibility barrier | Incorrect bill allocation; misleading budget comparison |
| P2 — Medium | Significant friction or degraded experience with a viable workaround | Difficult modal navigation; confusing search scope |
| P3 — Low | Minor polish or low-impact inconsistency | Small spacing or icon inconsistency |

Priority must reflect user impact and likelihood, not how easy or interesting a fix is.

### Compliance status

- `PASS` — criterion tested and met.
- `FAIL` — criterion tested and not met.
- `PARTIAL` — some but not all relevant cases pass.
- `N/A` — criterion does not apply; explain why.
- `UNVERIFIED` — not tested or evidence is insufficient.

Do not count `UNVERIFIED` or `N/A` as passing.

---

## 10. Scoring and reporting

Do not collapse all quality dimensions into one opaque score. Report separate results for:

1. Accessibility.
2. Usability and task completion.
3. Responsive behavior.
4. Visual consistency.
5. Reliability and data integrity.
6. Performance.
7. PWA/offline behavior.

For each domain, report:

- Number of criteria tested.
- PASS / FAIL / PARTIAL / N/A / UNVERIFIED counts.
- P0 / P1 / P2 / P3 findings.
- Routes and viewports covered.
- Important exclusions and limitations.

If a percentage is shown, state the denominator and exclude N/A and UNVERIFIED from the pass-rate denominator. Keep the unverified count visible.

### Suggested executive verdict

Use one of:

- **BLOCKED:** At least one unresolved P0 issue.
- **NOT READY:** No P0, but one or more unresolved P1 issues affect core workflows, trust, or essential accessibility.
- **CONDITIONALLY READY:** No unresolved P0/P1 issues; known P2/P3 issues and limitations are documented.
- **READY FOR THE DEFINED SCOPE:** Acceptance criteria for the agreed scope are met and evidence is complete.

This verdict is an internal release recommendation, not a claim of formal WCAG certification.

---

## 11. Audit execution plan

### Phase 0 — Preparation

- [ ] Read Audit 001 in full.
- [ ] Confirm the current product scope and which features are intended to ship.
- [ ] Confirm the target branch and commit SHA.
- [ ] Prepare a dedicated test account and synthetic data.
- [ ] Confirm no production data will be modified.
- [ ] Prepare viewport, theme, auth, and network test matrix.
- [ ] Record tool versions and commands.

### Phase 1 — Automated checks

- [ ] Run a production build.
- [ ] Run available automated tests.
- [ ] Run Lighthouse on representative routes and states.
- [ ] Run axe-core scans on representative pages and dialogs.
- [ ] Run Playwright smoke tests for critical journeys.
- [ ] Capture console errors and failed network requests.
- [ ] Record bundle/build output and route-level measurements where possible.

### Phase 2 — Manual audit

- [ ] Inspect all in-scope routes.
- [ ] Complete critical user journeys.
- [ ] Test keyboard behavior and focus.
- [ ] Test narrow viewports and zoom/reflow.
- [ ] Inspect contrast and visual hierarchy.
- [ ] Test loading, empty, error, and recovery states.
- [ ] Test dark and light themes.
- [ ] Test screen reader behavior where available.

### Phase 3 — Findings review

- [ ] Reproduce high-impact findings.
- [ ] Check source code for implementation evidence.
- [ ] Deduplicate overlapping findings.
- [ ] Assign confidence and priority.
- [ ] Separate confirmed defects from design preferences.
- [ ] Compare against Audit 001.
- [ ] Record areas not tested.

### Phase 4 — Handoff to remediation

- [ ] Produce the findings register.
- [ ] Group related findings into remediation workstreams.
- [ ] Write testable acceptance criteria.
- [ ] Identify dependencies and risks.
- [ ] Recommend fix order.
- [ ] Keep the audit report immutable; track fixes separately.
- [ ] Schedule a regression audit after remediation.

---

## 12. Required deliverables

Create the following artifacts in the repository:

```text
docs/
├── design/
│   ├── DESIGN.md
│   ├── DESIGN_TOKENS.md
│   └── COMPONENT_GUIDELINES.md
│
├── quality/
│   ├── AUDIT_STANDARDS.md
│   ├── ACCESSIBILITY_CHECKLIST.md
│   ├── RESPONSIVE_CHECKLIST.md
│   ├── UX_CHECKLIST.md
│   ├── PERFORMANCE_BUDGET.md
│   └── TESTING_PROTOCOL.md
│
└── audits/
    ├── 001-initial-audit.md
    └── 002-redesign-audit.md
```

If some files already exist, inspect and update them rather than creating duplicate documentation. Do not invent a design direction or tokens during the audit; record the current state and make recommendations separately.

The final `002-redesign-audit.md` should contain:

1. Executive summary and verdict.
2. Scope, environment, and methodology.
3. Standards used and their versions.
4. Coverage matrix.
5. Automated test results.
6. Findings register.
7. Screenshots/evidence references.
8. Comparison with Audit 001.
9. Unverified areas and limitations.
10. Prioritized remediation plan.

---

## 13. Definition of done

Audit 002 is complete only when:

- [ ] All agreed routes and critical journeys have a recorded coverage status.
- [ ] Every reported P0/P1 finding has reproducible steps or clearly stated evidence limitations.
- [ ] Accessibility checks include both automated and manual testing.
- [ ] Responsive checks include the agreed viewport matrix.
- [ ] Performance results distinguish lab data from field data.
- [ ] Findings have priorities, confidence labels, and testable acceptance criteria.
- [ ] Audit 001 findings are marked fixed, still present, regressed, not applicable, or unverified.
- [ ] No code changes were made as part of the audit-only phase.
- [ ] The report clearly states what was not tested.
- [ ] A separate remediation plan is ready for review.

**First action:** inspect the repository state and Audit 001, then propose the exact route/state coverage matrix and test plan for approval before executing any potentially destructive or production-facing test.
