# UX checklist

Covers usability, interaction, content and data integrity for SakuTrack, a daily money notebook for Indonesian college students. Mark each item `PASS / FAIL / PARTIAL / N/A / UNVERIFIED`. These items come from Nielsen's 10 heuristics (NN/g, last reviewed 30 January 2024) and SakuTrack's own product rules. They are heuristics, not a certification, so every failure has to state its user impact.

## Usability (heuristic # in brackets)
- [ ] Users can tell which page or feature they are on (1).
- [ ] Every action gets timely feedback: saving, saved, failed (1).
- [ ] Loading never looks like a finished or empty result (1).
- [ ] Labels use the students' words, not finance jargon (Saku, stash, PB1 and BYOK are explained or avoided) (2).
- [ ] Navigation is predictable and consistent across routes (4).
- [ ] Important actions are easy to find. No core feature lives only in an overflow menu (6).
- [ ] Users can undo, cancel, edit or recover where it makes sense (3).
- [ ] Destructive actions are clearly marked and confirmed, and the confirmation is not overused (3, 5).
- [ ] Forms block invalid or contradictory input (5).
- [ ] Empty states say what happened and what to do next (9, 10).
- [ ] Error messages explain the problem and the next step, in the interface's language (9).
- [ ] The key figure ("Sisa hari ini") is visible without scrolling (8).
- [ ] Repeated tasks such as logging an expense have fast paths that keep essential context (7).
- [ ] Guest mode limits and where data is stored are clear before the user commits (2, 10).

## Interaction
- [ ] Every button does something. No control is hover-only.
- [ ] Disabled, loading, pressed and selected states can be told apart.
- [ ] Repeated taps or Enter presses never create duplicate transactions. Submit is locked while a save is in flight.
- [ ] Labels stay visible after a value is typed.
- [ ] Currency inputs accept the Indonesian format (`15.000`, `15rb`) and show thousands grouping.
- [ ] Cancelling or editing never silently throws away data the user typed.
- [ ] A successful submit gives clear feedback.

## Content and localisation
- [ ] One primary interface language per session. No stray English in Indonesian mode or the reverse.
- [ ] Currency is always `Rp` with `.` as the thousands separator. Dates and periods are localised.
- [ ] No placeholder, debug or vendor strings show (model names, BYOK, raw Supabase errors).
- [ ] No exclamation marks or em dashes in system copy (DESIGN.md voice rule).
- [ ] Copy never claims a financial result the calculation doesn't support.

## Reliability and data integrity
- [ ] A failed save shows visible, actionable feedback and keeps what the user typed.
- [ ] A successful save survives a refresh and a fresh sign-in.
- [ ] A failed fetch never looks like empty data.
- [ ] Retrying never duplicates a financial record.
- [ ] Editing keeps fields the edit form doesn't show (for example, subscription notes).
- [ ] Totals match their transactions: dashboard, compare, archive, export, Saku and savings.
- [ ] Split Bill shares add up exactly to the total, including tax, service, discount and rounding. No item is assigned silently.
- [ ] Budget comparisons use equal periods or say how they are normalised.
- [ ] Exported figures match the source data and the selected period, and never show a budget the user didn't set.
- [ ] Guest-mode limits are described accurately.
- [ ] Authorisation is enforced: one user can't read or edit another user's records, except through a deliberately shared friend view.

## Critical journeys (detail in the Audit 002 plan, section 7)

| ID | Journey | Pass condition |
|---|---|---|
| A | First-time visitor | The choices are clear and no stray tap can create a guest account |
| B | Record an expense | Quick and standard entry each save once, with a clear preview and clear validation |
| C | Find an older expense | Search scope matches what the UI says |
| D | Understand the budget | Figures are correct, traceable and not misleading |
| E | Split a bill | Every allocation is explicit and the shares add up to the total |
| F | Edit a subscription | Untouched fields survive the edit |
| G | Failure and recovery | Feedback is honest, with no lost or duplicated data |
| H | Keyboard and assistive technology | The main tasks can be done without a pointer |
