---
id: QCLI-53
title: >-
  Settle the discard-timing looseness between wave-loop (f) and (g)'s
  clean-checkout precondition
status: To Do
assignee: []
created_date: '2026-08-08 14:44'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`.claude/skills/backlog-handover/reference/wave-loop.md` section (f) instructs the orchestrator to leave the mid-wave label edit uncommitted and discard it "before that task's branch reaches (g)'s **rebase step**." Section (g)'s precondition paragraph instead demands that the orchestrator's own `<default>` checkout "must be clean before this **walk starts**, and stays clean across every iteration of it," and (g) step 0 re-confirms it per member.

Those two deadlines are not the same point. "Before the rebase step" is later than "before the walk starts."

## Why it is not urgent, and why it is still worth settling

The two are reconcilable in practice — discarding immediately after (f)'s diff-confirmation step satisfies both readings — and doc-12 wave 1 did exactly that with no incident. The wording is also inherited verbatim from QCLI-49, which wrote it when `in-review` was the only label involved.

What changed is the margin. QCLI-51 gave `merge-pending` a point of action at the reviewer's `approve` verdict, which sits materially closer to (g) than `in-review`'s dispatch-time edit did. The looseness is therefore easier to trip over now than when the wording was written, even though the wording itself did not change.

This is pre-existing QCLI-49 debt, not a defect introduced by QCLI-51.

## Scope note

This is a mechanics-timing question in `reference/wave-loop.md`, deliberately kept separate from QCLI-52 (documentation legibility in `SKILL.md`). The doc-12 reviewer recommended the split explicitly: folding them together would blur two different axes and produce a task touching two files for two unrelated reasons.

Settling this may legitimately conclude that one of the two wordings should move to match the other, or that a single explicit discard point should be named — the disposition is open and should be derived from the current text, not assumed from this description.

## Origin

Surfaced as a `minor` finding during doc-11-era QCLI-49 work and again by doc-12 wave 1's review (2026-08-08), recorded as an unfiled proposal in doc-12 and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reference/wave-loop.md names a single unambiguous point at which the mid-wave label edit is discarded, and (f) and (g)'s precondition paragraph agree on it
- [ ] #2 The chosen disposition is derived from the current text and stated with its reasoning, including why the alternative wording was not adopted
- [ ] #3 (g)'s clean-checkout precondition remains true by construction under the settled wording, not by orchestrator discipline, for both the in-review and merge-pending edits
- [ ] #4 No remaining passage across SKILL.md and reference/wave-loop.md states a discard deadline that contradicts the settled one
- [ ] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->
