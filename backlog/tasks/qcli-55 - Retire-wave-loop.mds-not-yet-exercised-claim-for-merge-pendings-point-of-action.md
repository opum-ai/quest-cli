---
id: QCLI-55
title: >-
  Retire wave-loop.md's not-yet-exercised claim for merge-pending's point of
  action
status: To Do
assignee: []
created_date: '2026-08-08 18:29'
labels: []
dependencies: []
priority: medium
type: chore
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`reference/wave-loop.md` section (f)'s Evidence paragraph states that "`merge-pending`'s own point-of-action edit (step 2 above) **has not yet been separately exercised in a recorded wave** … that reuse itself is not yet direct evidence (`QCLI-51`)."

doc-13 wave 1 exercised it. `in-review` was applied at review dispatch, transitioned to `merge-pending` on the reviewer's `approve` verdict, both left uncommitted and discarded before the rebase, and the real label set reconstructed at settlement.

Confirmed on the merged result rather than from session narration: `QCLI-52`'s task file on `dev` carries only `campaign`, `cluster:skill-docs`, `wave-1` — neither review-adjacent label — and no committed task frontmatter anywhere in the repo carries either. That is `QCLI-51`'s durability claim confirmed empirically for the first time under a `merge-pending` transition. Merge commit: `d652126`.

The statement became false the moment doc-13's wave-1 log entry was written.

## Routing — two different treatments, deliberately

The same sentence appears twice, and CLAUDE.md's record-vs-current-assertion test sends the two occurrences different ways:

- `reference/wave-loop.md` (f) is **operative prose calibrating a reader's trust today** → correct in place.
- `SKILL.md`'s `QCLI-51` Provenance entry repeats it as a **dated record of what `QCLI-51` knew** → it must not be silently corrected or re-tensed. `QCLI-50`'s tense-only carve-out does **not** rescue an edit here, because reversing what the record asserts is not a tense-only edit. It gets an inline dated supersession amendment citing the directing task per the `QCLI-44` ruling, or is left intact.

## Why this is not folded into QCLI-53

The line sits inside section (f) — the section `QCLI-53` edits — but is outside all eight of `QCLI-53`'s acceptance criteria. Fixing it there would be exactly the drive-by the reviewer checklist's scope item flags.

## A second thing worth recording while here

doc-13 wave 1 was **size 1**, which collapses (f) step 4's discard deadline ("before that branch's rebase") and (g)'s precondition ("clean before the walk starts") onto the same instant. That run therefore supplies **no** evidence discriminating the two readings and must not be cited as a worked case toward `QCLI-53`.

## Origin

Surfaced by doc-13 wave 1's integration review (2026-08-08) and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reference/wave-loop.md section (f)'s Evidence paragraph cites doc-13 wave 1 as direct evidence for merge-pending's step-2 point of action, naming merge commit d652126 and what was observed, and the 'not yet been separately exercised' claim is removed as current prose
- [ ] #2 SKILL.md's QCLI-51 Provenance entry is treated as a record: either left intact, or amended inline with a dated superseded-marked note citing the directing task per the QCLI-44 ruling. It is not silently corrected or re-tensed
- [ ] #3 The evidence cited is verifiable from committed state (the merged task file's labels, and the absence of either label in any committed task frontmatter), not from session narration
- [ ] #4 It is recorded that doc-13 wave 1 was size 1 and therefore does not discriminate (f) step 4's discard deadline from (g)'s clean-checkout precondition, and supplies no evidence toward QCLI-53
- [ ] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->
