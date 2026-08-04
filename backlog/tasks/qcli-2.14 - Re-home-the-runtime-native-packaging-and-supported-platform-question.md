---
id: QCLI-2.14
title: 'Re-home the runtime, native-packaging, and supported-platform question'
status: Done
assignee:
  - '@claude-worker'
created_date: '2026-08-04 14:35'
updated_date: '2026-08-04 20:17'
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
- [x] #1 The QCLI-2.7 deliverables scope-cession paragraph no longer names QCLI-2.9 as the owner of runtime, native-packaging, or supported-platform evidence
- [x] #2 It names the research program Specs open questions as the holder and states plainly that no current task owns them, distinguishing the post-Lore-evidence gating on runtime and native packaging from the supported-platform matrix
- [x] #3 The Spec dependency table gains rows for QCLI-2.9 and QCLI-2.10 with their outputs and dependencies, or records explicitly why they sit outside it
- [x] #4 No new scope is claimed for any task and no open question is closed
- [x] #5 lore check --strict, lore validate --strict, and lore orphans report zero errors, zero warnings, and zero orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rewrite the scope-cession paragraph (currently lines 91-98) in docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md so it no longer names QCLI-2.9 as owner of runtime/native-packaging/supported-platform evidence (AC1); instead point to the research program Spec's Open questions section, state plainly no current task owns the question, and distinguish the post-Lore-evidence gate on 'Runtime and native packaging' from the ungated 'supported platform matrix' half (AC2).
2. Add QCLI-2.9 and QCLI-2.10 rows to the Spec's Design > Dependency order table in docs/specs/quest-cli-pre-implementation-research-program.md (AC3), with Output/Depends-on columns; QCLI-2.9's Output column explicitly scopes it to npm allocation/provenance only (not runtime/native-packaging/platform) so the table gives a table-level scope statement future cession disputes can check against (the task's stated root cause).
3. Do not touch the Spec's Open Questions bullets themselves (out of this task's two-file scope) and do not edit any other task's Backlog file — verifies AC4 (no new scope claimed, no question closed).
4. Run lore sync (git add/commit any regenerated managed-block output, since sync does not auto-commit here), then lore check --strict, lore validate --strict, lore orphans and confirm zero errors/warnings/orphans (AC5).
5. Record verification evidence and diff quotes in --append-notes, commit with Refs: QCLI-2.14 trailer, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified before edit: scope-cession paragraph at docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md lines 91-98 read '...that evidence-consumption question belongs to [QCLI-2.9](...), concurrent this wave, per the campaign's cluster-scope split.' Spec's Design > Dependency order table at docs/specs/quest-cli-pre-implementation-research-program.md stopped at the QCLI-2.8 row; Open questions section (untouched by this task) reads 'Final npm package ownership and supported platform matrix.' and 'Runtime and native packaging after Lore's completed evidence is reviewed.' as two separate bullets.

AC1: rewritten paragraph no longer names QCLI-2.9 as owner of runtime/native-packaging/supported-platform evidence; states 'no current QCLI task owns it' and 'QCLI-2.9 is not the owner of either'.
AC2: paragraph now points to the Spec's Open questions section by link+anchor, names it as holder, and distinguishes the post-Lore-evidence gate on 'Runtime and native packaging...' from the ungated 'Final npm package ownership and supported platform matrix' half, matching the Spec's own two-bullet phrasing verbatim.
AC3: added QCLI-2.9 (Depends on QCLI-2.1) and QCLI-2.10 (Depends on QCLI-2.5) rows to the Dependency order table, with an Output column for QCLI-2.9 that explicitly scopes it to npm allocation/provenance only; added one sentence noting both sit outside the QCLI-2.2-QCLI-2.7 synthesis chain QCLI-2.8 draws on and that neither resolves either open question.
AC4: double-checked via git diff — Open Questions section of the Spec is byte-identical (confirmed no lines changed there); no other task's Backlog file was touched (git diff --stat backlog/ shows only this task's own plan/notes, applied via backlog CLI); no scope language ('owns', 'is responsible for', etc.) was added to any task description. No open question closed.
AC5: after 'lore sync' (regenerated docs/log.md only; no managed-block changes needed since neither edited doc carries Story-coupling managed blocks) and committing docs/log.md separately: 'lore check --strict --plain' -> '21 files, 0 errors, 0 warnings' (exit 0); 'lore validate --strict --plain' -> '21 files, 0 errors, 0 warnings, 6 skipped' (exit 0); 'lore orphans --plain' -> '0 orphan tasks, 0 dangling links' (exit 0). Baseline (pre-edit) was also 0/0/0, so the gate was never red.

Out-of-scope discovery (not acted on): none new. QCLI-2.7's document already records its own out-of-scope discovery (ADR-0009 citation-slice gap) from its own prior pass; not re-touched here.

Fix-pass (F1, second review, blocking): docs/specs/quest-cli-pre-implementation-research-program.md line ~72 read '...outside the QCLI-2.2-QCLI-2.7 synthesis chain that QCLI-2.8 draws on...'. Stale on arrival: commit 94529f0 (this branch's merge-base) had already widened QCLI-2.8's live Dependencies to QCLI-2.2-2.7 plus QCLI-2.11,2.12,2.13,2.14 (owner-approved) before this branch's content commit 3d55e9d added the sentence. The underlying claim (neither QCLI-2.9 nor QCLI-2.10 is a QCLI-2.8 input; neither resolves either open question) was and remains true -- only the range naming the old dependency set was wrong. Fixed by dropping the stale range clause: now reads '...outside the synthesis chain that QCLI-2.8 draws on...'. Did not restate QCLI-2.8's full live input set inline, and did not touch the separate pre-existing Dependency-order table row for QCLI-2.8 (line ~68, same stale QCLI-2.2-QCLI-2.7 range) -- that row is a distinct, pre-existing finding explicitly deferred to an owner decision, out of scope here. No task scope claimed, no open question closed. Verified backlog task view QCLI-2.8 --plain live Dependencies field: QCLI-2.2, QCLI-2.3, QCLI-2.4, QCLI-2.5, QCLI-2.6, QCLI-2.7, QCLI-2.11, QCLI-2.12, QCLI-2.13, QCLI-2.14. Gates after fix: lore check --strict -> 21 files, 0 errors, 0 warnings (exit 0); lore validate --strict -> 21 files, 0 errors, 0 warnings, 6 skipped (exit 0); lore orphans -> 0 orphan tasks, 0 dangling links (exit 0). No managed-block regeneration triggered; git status clean after gates. Commit 9c78335, Refs: QCLI-2.14.

Settlement (orchestrator, wave 4): Merged as PR #15, squash commit 157ad56, after a fix-and-re-review cycle for F1 (a newly-authored Spec sentence cited QCLI-2.8's stale pre-widening dependency range). Note: the resumed teammate first assigned this fix stalled for 2+ hours with zero commits; killed and redispatched as a background agent, which completed in under 2 minutes — see campaign doc conventions. Reviewer verdict on 2nd pass: approve — all 5 ACs independently re-confirmed, F1 fix judged adequate (dropping the stale range rather than inlining a second hand-maintained copy of QCLI-2.8's live dependency list), the deliberately-deferred pre-existing staleness at the Spec's QCLI-2.8 table row (line ~68) confirmed correctly left untouched. Gates: lore check --strict 21 files 0/0; lore validate --strict 21 files 0/0 6 skipped; lore orphans 0/0. Wave-4 integration review raised no blocking cross-task finding against this document; confirmed the deferred QCLI-2.8 table-row staleness is still exactly as it should be (untouched, not accidentally resolved by a later wave-4 merge).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered 2 edits closing an orphaned-ownership gap: QCLI-2.7's deliverable no longer names QCLI-2.9 as owner of runtime/native-packaging/supported-platform evidence (QCLI-2.9 never actually received or covered that scope); the research program Spec's Open Questions are now explicitly named as the true, currently-unowned holder, with the post-Lore-evidence gating on runtime/native-packaging correctly distinguished from the ungated supported-platform matrix. The Spec's dependency table gained rows for QCLI-2.9 and QCLI-2.10. No new scope claimed for any task; neither open question closed. A separate, pre-existing staleness in the Spec's QCLI-2.8 dependency-table row (predates this task, deliberately out of scope) remains for a future owner decision.
<!-- SECTION:FINAL_SUMMARY:END -->
