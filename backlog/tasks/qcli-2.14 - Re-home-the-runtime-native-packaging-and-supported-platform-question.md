---
id: QCLI-2.14
title: 'Re-home the runtime, native-packaging, and supported-platform question'
status: In Progress
assignee:
  - '@claude-worker'
created_date: '2026-08-04 14:35'
updated_date: '2026-08-04 16:46'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rewrite the scope-cession paragraph (currently lines 91-98) in docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md so it no longer names QCLI-2.9 as owner of runtime/native-packaging/supported-platform evidence (AC1); instead point to the research program Spec's Open questions section, state plainly no current task owns the question, and distinguish the post-Lore-evidence gate on 'Runtime and native packaging' from the ungated 'supported platform matrix' half (AC2).
2. Add QCLI-2.9 and QCLI-2.10 rows to the Spec's Design > Dependency order table in docs/specs/quest-cli-pre-implementation-research-program.md (AC3), with Output/Depends-on columns; QCLI-2.9's Output column explicitly scopes it to npm allocation/provenance only (not runtime/native-packaging/platform) so the table gives a table-level scope statement future cession disputes can check against (the task's stated root cause).
3. Do not touch the Spec's Open Questions bullets themselves (out of this task's two-file scope) and do not edit any other task's Backlog file — verifies AC4 (no new scope claimed, no question closed).
4. Run lore sync (git add/commit any regenerated managed-block output, since sync does not auto-commit here), then lore check --strict, lore validate --strict, lore orphans and confirm zero errors/warnings/orphans (AC5).
5. Record verification evidence and diff quotes in --append-notes, commit with Refs: QCLI-2.14 trailer, push branch.
<!-- SECTION:PLAN:END -->
