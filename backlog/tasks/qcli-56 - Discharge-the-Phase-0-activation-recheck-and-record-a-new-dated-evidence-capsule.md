---
id: QCLI-56
title: >-
  Discharge the Phase 0 activation recheck and record a new dated evidence
  capsule
status: To Do
assignee: []
created_date: '2026-08-08 21:41'
updated_date: '2026-08-08 21:43'
labels:
  - campaign
  - 'cluster:gate'
dependencies: []
priority: high
type: chore
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`docs/reference/quest-cli-activation-gate-evidence-record.md` carries a mandatory recheck clause that is now owed. It states that a future activation session **MUST** re-run every command in its "Evidence consumed" table — not reuse the 2026-08-05 capsule as current — and **MUST** separately obtain live confirmation from `lore-doc`'s own owner-held evidence that the release-gate predicate reports Pass, before implementation may be treated as active.

That clause has not been discharged, and its pins have moved. The record pins `lore-doc` at `45d0d90f68a6` (read 2026-08-05) and notes it advanced to `d2a9a9e11ddf`, itself already historical. A read-only spot check on 2026-08-08 found `lore-doc` at HEAD `101f9bb` — two moves beyond the capsule's own pin.

## What is already established, and must not be re-litigated

The record reports that on 2026-08-06 `lore-doc` accepted the Lore `0.1.1` release boundary in `LDOC-4` and its gate Spec reports the result as **open**. That is the owner's own conclusion, read rather than inferred.

It also states, emphatically: **"An open Lore gate is not activation."** It clears the Lore-owned precondition only; this repository's own Phase 0 obligation — this recheck — is still owed.

## The hard constraint on this task

The record forbids exactly the shortcut this task might tempt a worker into: a worker in this repository may **never** assert the gate has opened, compute a Pass/Fail from the recheck's own output, or treat a dated snapshot as a substitute for the live check. Reading the owner's own stated conclusion is permitted and is what clause 4 requires; deriving one is not. Every result recorded must be either a literal quote of what the gate's owner has said, or a dated observation of an input.

## Method note

All three peer clones are present locally (`/Volumes/external/repos/{lore-doc,lore-cli,quest-doc}`), verified 2026-08-08, so the evidence table is fully re-runnable. Fetch before reading — a stale local clone is precisely the "stale input" the predicate says makes the result closed.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, as the gating task of a campaign scoped to what is required to begin implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every command in the record's existing Evidence consumed table is re-run live within one narrow, explicitly timestamped inspection boundary, with each command's literal output recorded
- [ ] #2 lore-doc's current gate-result statement is quoted verbatim from its live Spec at a named HEAD, and LDOC-4's live status is recorded, both read as the owner's conclusion and never computed here
- [ ] #3 The new capsule is appended as a new dated section and the 2026-08-05 capsule is preserved intact, per the preserve-and-amend ruling governing evidence records (CLAUDE.md, QCLI-45)
- [ ] #4 The record states whether the four-clause predicate is reported Pass by its owner at this boundary, sourced only to the owner's own words, and computes no gate result of its own
- [ ] #5 Every moving reference carries the re-verify qualifier and every immutable anchor is stated flat, per the research programme Spec's moving-vs-immutable convention
- [ ] #6 Any input that changed since the 2026-08-05 capsule is recorded as a new dated fact for lore-doc to rule on, explicitly not acted on here
- [ ] #7 No product source, package metadata, runtime dependency, executable scaffolding, or install instruction is added by this task
<!-- AC:END -->
