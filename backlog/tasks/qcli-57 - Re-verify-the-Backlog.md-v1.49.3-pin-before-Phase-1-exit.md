---
id: QCLI-57
title: Re-verify the Backlog.md v1.49.3 pin before Phase 1 exit
status: In Progress
assignee: []
created_date: '2026-08-08 21:42'
updated_date: '2026-08-08 21:45'
labels:
  - campaign
  - 'cluster:decisions'
  - wave-1
dependencies: []
priority: medium
type: chore
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The delivery roadmap's Phase 1 exit carries one standing re-verification obligation beyond its decision table: the migration fidelity contract is pinned to Backlog.md **v1.49.3**, and its own recheck clause obliges re-checking that pin "before this phase's exit, or any freeze, whichever comes first." Every `FR-MIG` requirement rests on findings from that build.

This is the last Quest-owned item outstanding in Phase 1. Every other Phase 1 decision is recorded Closed (envelope shape, exit-code table, not-found convention on Quest's side, identifier grammar, license, platform, scale target, anomaly placement). The two that remain open are explicitly **not Quest's to make** — D6's product-wide actor model belongs to `quest-doc`, and the `lore-doc` half of the not-found convention belongs to that owner.

## Precision that matters

The roadmap already carries a correction worth heeding: QCLI-17 corrected an earlier claim that this re-verification was "overdue," which had inherited a since-corrected assertion that the pin was probably stale. It was not — the register records a verified 2026-08-05 registry state with `npm view backlog.md version` and `dist-tags.latest` both `1.49.3` and `time.modified` 2026-08-03.

So the expected outcome is confirmation, not drift. **Do not write this up as though drift were expected, and do not treat an unchanged pin as a null result** — an unchanged pin discharges a real obligation and should be recorded as such, with its date.

## Scope

Read-only registry verification plus a dated recording. This task decides nothing and re-pins nothing.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, as Phase 1's last Quest-owned exit obligation in a campaign scoped to what is required to begin implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 npm view backlog.md version, its dist-tags.latest, and its time.modified are re-run live and recorded with the observation date and literal output
- [ ] #2 The observed result is compared explicitly against the recorded v1.49.3 pin, and the comparison's outcome is stated whether or not it changed
- [ ] #3 The migration fidelity contract's recheck obligation is discharged with the new dated observation, or its continuing obligation is restated with reasoning if it cannot be
- [ ] #4 If the pin moved, the consequence for the FR-MIG requirements resting on that build is named explicitly and the task does not silently re-pin; if it did not move, that is recorded as a positive discharge rather than omitted
- [ ] #5 Moving references carry the re-verify qualifier and immutable anchors are stated flat, per the research programme Spec's convention
- [ ] #6 Any edit to the open component decisions register is confined to this pin's recorded status; no other decision entry is altered
<!-- AC:END -->
