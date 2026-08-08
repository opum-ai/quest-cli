---
id: QCLI-52
title: Finish the stage-state legibility sweep QCLI-51 started
status: In Progress
assignee: []
created_date: '2026-08-08 14:43'
updated_date: '2026-08-08 16:09'
labels:
  - campaign
  - 'cluster:skill-docs'
  - wave-1
dependencies: []
priority: medium
type: chore
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

QCLI-51 (merged as `79545d6`, 2026-08-08) reconciled `.claude/skills/backlog-handover/SKILL.md`'s campaign stage-state table with the fact that the `in-review` and `merge-pending` labels are applied to the working tree and then deliberately discarded uncommitted, so neither is ever observable in committed Backlog state.

doc-12 wave 1's wave-level integration review found two passages that still describe where campaign substate is legible without accounting for what is actually committed. Both are the same defect class QCLI-51 closed; neither is a defect in QCLI-51's merged diff.

## The two passages

1. **`SKILL.md`'s "Stage state" convention row** reads: "Backlog has three statuses, the campaign has six stages. Status carries the coarse state, labels carry the sub-stage — see the state table below." After QCLI-51 that is only two-thirds true: for two of the six stages the labels carry the sub-stage *only in the working tree*, never in committed state. It sits roughly 15 lines upstream of the table that now corrects it, so a cold reader forms exactly the impression QCLI-51 was chartered to remove before reaching the correction. It is not a contradiction — it does say "see the state table below" — but it is the one passage left asserting the pre-QCLI-51 framing unqualified.

2. **`SKILL.md` R2 step 5's list of durable signals is presented as exhaustive and is not.** It says "Derive the review substage instead from what actually persists:" and enumerates three signals (the orchestrator's own `<default>` working-tree dirtiness, the worktree's own `git log`, `gh pr list`). It omits the campaign doc's **in-flight table** — the one substate record this campaign commits on purpose. `reference/templates.md` defines its columns (`Worktree path | Branch | Stage reached`); `reference/wave-loop.md`'s scope note states the in-flight pointer commit "is always committed immediately"; and commit `68ce681` (doc-12 wave 1) is a worked example. That is a durable, purpose-built substage record and arguably stronger evidence than any of the three currently listed. Nothing is broken today — R1/R3 do consult the campaign doc — but step 5 is precisely where a crash-recovery reader is told what persists.

## Method note for whoever picks this up

QCLI-51's own AC#5 sweep could not have caught either passage: that sweep grepped `in-review`/`merge-pending`, and neither passage contains those strings. The sweep was correct within its stated method. A sweep for this task must not be scoped the same way — search for prose *about* where substate is recorded, not for the label names.

## Origin

Surfaced by doc-12 wave 1's integration review (2026-08-08), recorded as an unfiled proposal in doc-12 and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL.md's Stage state convention row no longer asserts unqualified that labels carry the sub-stage, and is consistent with the stage-state table's durability column without requiring the reader to reach the table first
- [ ] #2 SKILL.md R2 step 5 names the campaign doc's in-flight table among the durable signals that classify a leftover branch's review substage, or states explicitly why it is excluded
- [ ] #3 A sweep scoped to prose about where campaign substate is recorded (not to the label names) finds no further passage across SKILL.md and reference/*.md asserting the pre-QCLI-51 framing; the sweep's method and results are recorded in the task notes
- [ ] #4 The change is consistent with QCLI-49's rule that mid-wave task-file label edits are never committed on <default> while the branch is unmerged, and with QCLI-51's merged framing
- [ ] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->
