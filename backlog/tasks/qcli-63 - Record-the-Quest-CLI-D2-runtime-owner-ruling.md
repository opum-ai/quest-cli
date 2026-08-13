---
id: QCLI-63
title: Record the Quest CLI D2 runtime owner ruling
status: Done
assignee: []
created_date: '2026-08-09 07:42'
updated_date: '2026-08-09 07:45'
labels:
  - decisions
  - governance
dependencies: []
references:
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/reference/quest-cli-d2-runtime-proposal.md
  - docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md
priority: high
type: docs
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The component owner ruled D2 (runtime and native packaging) in a live session on 2026-08-09: Bun, matching the shipped @opum-ai/lore runtime and its compiled per-platform binary distribution. The ruling is recorded portfolio-wide in opum-doc's 'Adopt Bun as the runtime for Opum command-line components' ADR; quest-cli owns D2 (ownership claimed by QCLI-27) and so records the closure here.

This discharges the hazard QCLI-61 was filed to guard: that the first worker acting on CLAUDE.md's product-source permission would decide D2 by construction, pre-empting a ruling reserved for the owner. The owner has now ruled, so no worker decides it implicitly.

Follows the QCLI-27 precedent: governance-level rulings that close register entries without an architectural trade-off are recorded as dated Reference documents citing their provenance, not as ADRs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A dated Reference record states the D2 ruling: runtime = Bun, with the compiled per-platform binary distribution pattern matching @opum-ai/lore
- [x] #2 The record names the 2026-08-09 owner ruling as provenance and cites opum-doc's Bun ADR as the portfolio-level decision
- [x] #3 The open component decisions register's D2 row is updated from Blocked to Closed, with the Unblocked-by cell citing this ruling
- [x] #4 The register's D2 detail paragraph is amended to record the closure without rewriting its existing history
- [x] #5 The roadmap-versus-register disagreement over whether D2 gates Phase 2 or only Phase 6 is left UNRESOLVED and unamended, per QCLI-61's explicit non-goal
- [x] #6 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Recorded the owner's 2026-08-09 live ruling closing D2: runtime = Bun, distributed as compiled per-platform binaries behind a minimal Node launcher, matching the pattern @opum-ai/lore 0.2.0 already ships (verified: engines requires bun >=1.3.14; build is bun build --compile; bin/lore.cjs is a Node CJS launcher resolving per-platform optionalDependencies; every dependency including the native @ladybugdb/core sits in devDependencies because it is compiled in).

Judgment call, following QCLI-27: recorded as a dated Reference (docs/reference/quest-cli-d2-runtime-ruling.md) rather than an ADR, because this closes a register entry on an owner ruling without an architectural trade-off — the same shape as the license/platform/runtime ownership record.

Preserved QCLI-58's own caution rather than eliding it: the proposal states that matching Lore 'does not by itself simplify integration'. The record therefore names the decisive technical argument as belonging to opum-harness (its guard runs on every tool call, placing process startup on the critical path — a constraint quest-cli does not share) and states plainly that quest-cli is a follower in this ruling, not its cause.

Register amendment was append-only in substance. Verified by probing the post-edit file for five prior sentences including 'entry's status — Blocked — and every sentence above are unchanged by it' and the QCLI-58 comparison sentence: all PRESERVED verbatim. git diff --numstat reports 10 insertions / 2 deletions; both deleted lines are lines that were extended, and the only genuine content removal is the status cell value Blocked, which AC3 requires.

Explicitly left unresolved per QCLI-61's stated non-goal: the roadmap-versus-register disagreement over whether D2 gates Phase 2 or only Phase 6. docs/specs/quest-cli-delivery-roadmap.md is untouched (git status returns zero entries for it). The record also notes that this ruling discharges QCLI-61's hazard, since the runtime is no longer decided by construction by the first worker to write a package.json — but it does not close QCLI-61, whose guard-clause scope is CLAUDE.md and remains the owner's to direct.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded the owner's 2026-08-09 ruling closing D2 as Bun, in a dated Reference record following the QCLI-27 precedent, and updated the open-decisions register's D2 row from Blocked to Closed. Verified with lore validate --strict and lore check (49 files, 0 errors, 0 warnings each), and by probing the amended register for five prior sentences to confirm the append-only amendment lost no history. The roadmap-versus-register Phase 2 disagreement is left unresolved per QCLI-61's explicit non-goal.
<!-- SECTION:FINAL_SUMMARY:END -->
