---
id: QCLI-61
title: Guard CLAUDE.md's new product-source permission against silently closing D2
status: Done
assignee: []
created_date: '2026-08-09 03:15'
updated_date: '2026-08-09 13:51'
labels: []
dependencies: []
priority: high
type: chore
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`QCLI-59` (merged `34a1c36`) narrowed `CLAUDE.md`'s pre-activation prohibition so that product source, executable scaffolding, a `package.json`, a `bin` entry, and runtime dependencies became permitted. That was correct and explicitly authorized by the user.

Doc-14 wave 2's **integration review** found a consequence neither single-task review could see, because it only appears once both wave members are merged together.

## The hazard

`CLAUDE.md`'s "Now permitted" bullet lists `package.json`, a `bin` entry, and runtime dependencies, and attaches D2 only to Phase 6. But **none of those three artifacts can be written without naming a runtime.** So the first worker acting on the permission decides D2 by construction — the exact ruling `QCLI-58`'s proposal was written to reserve for the owner, and what the delivery roadmap itself calls "an undocumented decision, which is worse than a delay."

`CLAUDE.md` says the amendment "does not choose a runtime." That is true of the amendment and false of what it authorizes.

Two documents inside the same wave diff say D2 binds earlier than Phase 6:

- `docs/reference/quest-cli-open-component-decisions.md` — D2's **Needed for** cell reads "Phases 2 and 6". `QCLI-58` edited the adjacent "Unblocked by" cell and left this one.
- `backlog/docs/campaigns/doc-14 - Backlog-campaign-tracker.md` — "D2 is now the one substantive thing standing between this repository and its first line of product source."

## The disagreement this task must NOT resolve

`docs/specs/quest-cli-delivery-roadmap.md`'s phase table lists Phase 6 against "Phase 0; D2 and D3" and Phase 2 against "Phase 1; Phase 0 for any code" — i.e. the roadmap does **not** list D2 as gating Phase 2, while the register's "Needed for" cell does.

That disagreement **predates this wave** (verified at doc-14 wave-2 settlement); the wave is only what made it operative. Reconciling it is separate, larger work requiring an owner's ruling on which record is authoritative. This task records the disagreement as an observed fact and leaves both documents unamended.

## Scope

Narrow: a guard clause in `CLAUDE.md`. This task does not amend `docs/`, does not reverse `QCLI-59`, and does not decide D2.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 close, from finding F1 (HIGH) of wave 2's integration review. Full finding and verification recorded in doc-14's campaign tracker under "Proposed follow-ups".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The permitted bullet in CLAUDE.md carries an explicit guard stating that the first artifact naming a runtime (a package.json, a bin entry, or a runtime dependency) closes D2, so the owner's D2 ruling must land first or be explicitly declared unnecessary
- [ ] #2 The guard does not re-prohibit product source generally, and does not reverse or weaken QCLI-59's amendment; publication, release workflows, public install instructions, and package reservation remain prohibited pending Phase 6 exactly as QCLI-59 left them
- [ ] #3 The amendment cites QCLI-58 (the proposal reserving the D2 ruling) and names this directing task, per the QCLI-44 citation ruling
- [ ] #4 The worker records the register-vs-roadmap disagreement it relies on -- the open component decisions register's D2 'Needed for' cell reads 'Phases 2 and 6' while the delivery roadmap's phase table lists D2 against Phase 6 only -- as an observed, unreconciled fact, without amending either document
- [ ] #5 No claim that @opum-ai/quest is published, installable, or released is introduced, and no package.json, bin entry, src directory, lockfile, or other scaffolding is created
- [ ] #6 A sweep confirms no other passage in CLAUDE.md now reads as authorizing a runtime-naming artifact without the guard; method and results recorded in the task notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Closed as discharged on 2026-08-09 without implementing the guard clause, on the owner's ruling. No CLAUDE.md guard was written.

The hazard this task existed to prevent — the first worker writing a package.json, bin entry, or runtime dependency thereby deciding D2 by construction — no longer exists. The owner ruled D2 in a live session on 2026-08-09 (QCLI-63, recorded in docs/reference/quest-cli-d2-runtime-ruling.md): runtime = Bun. A runtime-naming artifact now cites a closed decision instead of pre-empting an open one.

Two of this task's own acceptance criteria were superseded by owner rulings rather than met:
- AC1 required the guard to state that the D2 ruling must land first 'or be explicitly declared unnecessary'. The ruling landed, which is the first branch of AC1's own disjunction.
- AC4 required recording the register-versus-roadmap disagreement 'without amending either document'. The owner has since ruled that the register be aligned to the roadmap, which makes the no-amendment constraint obsolete. That alignment is tracked separately.

The remaining ACs (2, 3, 5, 6) were preconditions on a guard clause that is no longer warranted, so they are not met and are not claimed as met.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed as discharged, not implemented: no guard clause was written. QCLI-63's D2 ruling (Bun, 2026-08-09) removed the decide-by-construction hazard this task guarded against, satisfying AC1's own 'or be explicitly declared unnecessary' branch. AC4 was superseded by the owner's ruling to align the register to the roadmap. ACs 2, 3, 5 and 6 are preconditions on a clause no longer warranted and are explicitly not claimed as met.
<!-- SECTION:FINAL_SUMMARY:END -->
