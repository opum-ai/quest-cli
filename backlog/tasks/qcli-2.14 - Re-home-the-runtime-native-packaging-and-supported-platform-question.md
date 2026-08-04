---
id: QCLI-2.14
title: 'Re-home the runtime, native-packaging, and supported-platform question'
status: To Do
assignee: []
created_date: '2026-08-04 14:35'
labels:
  - campaign
  - research
  - scope
  - convention
  - no-implementation
  - 'cluster:convention'
dependencies:
  - QCLI-2.13
parent_task_id: QCLI-2
priority: medium
type: docs
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.7 explicitly cedes runtime, native-packaging, and supported-platform evidence-consumption to QCLI-2.9. QCLI-2.9 never received it: its scope (AC1-AC5) is npm package allocation and provenance only, and its merged 257-line deliverable contains no content on any of the three. The research program Spec holds both halves as open questions — "Final npm package ownership and supported platform matrix" and "Runtime and native packaging after Lores completed evidence is reviewed" — and the second is explicitly gated on completed Lore evidence, i.e. post-activation and structurally not this waves.

Why this matters more than an ordinary loose end: the question is currently cited as owned while being in fact unowned, which is worse than visibly open, because the pointer suppresses the re-derivation that would surface it. QCLI-2.8 synthesizes from QCLI-2.2 through QCLI-2.7 and would inherit the pointer without inheriting an answer.

Probable root cause worth fixing in the same pass: the Spec dependency table stops at QCLI-2.8 and has no row for QCLI-2.9 or QCLI-2.10, so tasks created after it have no table-level scope statement to arbitrate a cession dispute against.

Documentation only. Do not claim new scope for any task and do not silently close an open question.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The QCLI-2.7 deliverables scope-cession paragraph no longer names QCLI-2.9 as the owner of runtime, native-packaging, or supported-platform evidence
- [ ] #2 It names the research program Specs open questions as the holder and states plainly that no current task owns them, distinguishing the post-Lore-evidence gating on runtime and native packaging from the supported-platform matrix
- [ ] #3 The Spec dependency table gains rows for QCLI-2.9 and QCLI-2.10 with their outputs and dependencies, or records explicitly why they sit outside it
- [ ] #4 No new scope is claimed for any task and no open question is closed
- [ ] #5 lore check --strict, lore validate --strict, and lore orphans report zero errors, zero warnings, and zero orphans
<!-- AC:END -->
