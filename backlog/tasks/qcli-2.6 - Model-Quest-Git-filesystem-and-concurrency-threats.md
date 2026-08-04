---
id: QCLI-2.6
title: 'Model Quest Git, filesystem, and concurrency threats'
status: In Progress
assignee:
  - '@jeremy-newhouse'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 19:06'
labels:
  - campaign
  - research
  - threat-model
  - git
  - concurrency
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:threat-model'
  - wave-4
  - in-review
dependencies:
  - QCLI-2.2
  - QCLI-2.3
  - QCLI-2.4
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create an implementation-independent threat model for authoritative task and event records coordinated through Git across local worktrees and multiple clones. Derive observable safety and recovery requirements without selecting a physical storage design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The model covers dirty worktrees, partial writes, retries, duplicate events, aliases, clocks and leases, races, divergence, hostile paths, encoding, case sensitivity, subdirectories, and repository removal
- [ ] #2 Mutation invariants require atomicity, idempotency, conflict detection, operation-owned staging and commits, and zero mutation from read-only commands
- [ ] #3 Real-clone and fault-injection scenarios are specified without inheriting prototype layouts or algorithms
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Research complete: read the component charter, research source register, migration ledger (row OCLI-3.6 -> QCLI-2.6), research program Spec (dependency table + Required Outputs + moving-vs-immutable-references convention), and this task's three dependencies' deliverables (QCLI-2.2 legacy reconciliation candidates #1/#3/#4/#5/#8/#9/#10; QCLI-2.3 black-box scenarios BB-01..BB-17, esp. lease/heartbeat, read-only purity, recovery, hostile paths, dirty worktrees, canonical IDs, operation-owned Git effects; QCLI-2.4 glossary/actor/workflow doc, which explicitly defers "concurrency mechanics" and "concurrent reclamation attempts" to QCLI-2.6). Confirmed no Backlog.md-specific fact is needed for this document (it is an implementation-independent Git/filesystem/concurrency model, not a Backlog migration-fidelity study) and no external moving reference (opum-doc/quest-doc/lore-cli live HEAD) needs citing, since all grounding is this repo's own already-admitted, same-branch documents plus general, publicly documented Git/filesystem behavior (case-folding, symlinks) that is not Backlog.md-derived.
2. Scaffold docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md via 'lore new reference' (new file, mine to own this wave; no collision with QCLI-2.5/2.12/2.14's files).
3. Author: (a) a provenance/grounding table (charter, migration ledger, research program Spec, QCLI-2.2, QCLI-2.3, QCLI-2.4, all cited read-only, this branch); (b) a scope/non-goals section stating this model is implementation-independent (no file layout, lock mechanism, merge algorithm, or schema chosen) and its topology assumption (local worktrees + multiple clones coordinating only through Git, per the charter's "Git-tracked authored records are authoritative" and the task description); (c) a threat catalog with one subsection per AC1 category in order (dirty worktrees, partial writes, retries, duplicate events, aliases, clocks and leases, races, divergence, hostile paths, encoding, case sensitivity, subdirectories, repository removal), each stating the threat, why it matters (grounded in a cited source or, where the threat is substrate-level Git/filesystem behavior with no admitted-source equivalent, explicitly labeled as such), and the derived observable safety/recovery requirement; (d) a "Mutation invariants" section formally naming the 5 AC2 invariants (atomicity, idempotency, conflict detection, operation-owned staging and commits, zero mutation from read-only commands), each with an implementation-independent statement and which threats it defends against; (e) a traceability table mapping every AC1 threat to its grounding citation(s) and the invariant(s)/scenario(s) that address it; (f) ~10-12 independently authored real-clone and fault-injection scenarios (TM-01..TM-12) covering the threat categories, each specifying a real multi-clone/worktree setup, an injected fault, the required invariant-preserving observable outcome, and a verification check -- explicitly not reusing any prototype test layout or algorithm (no legacy or Backlog.md source was opened to write these); (g) an Independence/verification and Notes section mirroring the house convention in QCLI-2.3/2.4's deliverables.
4. Run 'lore validate --strict' and 'lore check --strict' against the new file iteratively while drafting; fix any errors.
5. Run 'lore sync' exactly once as the final content step (regenerates docs/reference/index.md, docs/log.md, and the Story's managed task block), then re-run 'lore check --strict', 'lore validate --strict', and 'lore orphans' from the worktree root as the closing gate; commit the regenerated docs/ files explicitly (lore sync does not auto-commit docs/ in this environment).
6. Record notes with decisions, sources admitted, and literal gate output via --append-notes; commit in small logical commits with 'Refs: QCLI-2.6' trailers; push feat/qcli-2.6-threat-model last.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md (new Reference, scaffolded via 'lore new reference'; no collision with QCLI-2.5/2.12/2.14's files this wave).

Sources cited (all read-only, this branch, "Prior QCLI research records" per the register): the component charter; the migration ledger (row OCLI-3.6 -> QCLI-2.6; also owned this wave by QCLI-2.12); the research program Spec (dependency table, Required Outputs, moving-vs-immutable-references convention; owned this wave by QCLI-2.14); QCLI-2.2's legacy reconciliation (candidates #1/#2/#3/#4/#5/#8/#9/#10); QCLI-2.3's black-box scenarios (BB-01..BB-17, all 8 categories); QCLI-2.4's glossary/actors/workflows (which explicitly defers "concurrency mechanics" and "concurrent reclamation attempts" to this task). A minority of threats (case sensitivity, symlink handling) are grounded in Git's own publicly documented cross-platform behavior (core.ignorecase, case-folding collisions), explicitly labeled as not sourced from Backlog.md/Opum/any register slice -- Git itself is not a clean-room admission question. No Backlog.md fact, no QCLI-2.7 Lore-evidence fact, and no external moving reference (opum-doc/quest-doc/lore-cli live HEAD) was needed or cited, so no recheck clause applies.

AC1: 13 threat-catalog subsections in the exact order given (dirty worktrees, partial writes, retries, duplicate events, aliases, clocks and leases, races, divergence, hostile paths, encoding, case sensitivity, subdirectories, repository removal), each with Threat / Why it matters (grounded) / Requirement. Clocks-and-leases separates accidental clock skew from self-reported-timestamp trust (no central arbiter exists); repository removal separates three tiers (synchronized history / local-only unsynchronized commits / disposable projection) to avoid papering over a false-success report if an unsynchronized clone is destroyed.

AC2: 5 mutation invariants (INV-1 Atomicity, INV-2 Idempotency, INV-3 Conflict detection, INV-4 Operation-owned staging and commits, INV-5 Zero mutation from read-only commands), named verbatim from the AC, each stated once with an explicit "Defends against" list, plus a full threat-to-invariant-to-scenario traceability table.

AC3: 12 independently authored real-clone/fault-injection scenarios (TM-01..TM-12) in a deliberately different 4-field shape from BB-01..BB-17 (Setup / Fault / Required outcome / Verification), covering kill-mid-write, kill-after-commit-before-response, real two-clone claim races, stale-basis divergence, injected clock skew, worktree/clone destruction under a live lease, dirty-worktree-plus-crash, hostile-path payloads, non-UTF-8 injection, cross-filesystem case-folding collision, concurrent subdirectory+alias registration, and partial multi-file write failure. No prototype test layout, fixture, or algorithm was opened to write these -- no legacy Opum or Backlog.md source is admitted to inform this task at all.

Gates (worktree root, after the single terminal 'lore sync' run, re-verified after committing the regenerated docs/ files):
- lore check --strict --plain -> '22 files, 0 errors, 0 warnings' (exit 0)
- lore validate --strict --plain -> '22 files, 0 errors, 0 warnings, 6 skipped' (exit 0)
- lore orphans --plain -> '0 orphan tasks, 0 dangling links' (exit 0)
Pre-sync, 'lore check --strict' showed the expected status-drift/managed-block-drift errors on the Story (status 'todo' vs live 'in-progress') caused by marking this task In Progress -- resolved by the single terminal 'lore sync' run, consistent with this campaign's established convention (see QCLI-2.3/2.4's notes).

No sibling-owned file was edited (register, migration ledger, research program Spec, Lore dependency and adapter contract evidence doc, QCLI-2.5's/2.14's deliverables). No Backlog.md implementation source/tests, local Backlog.md clone, Quarantined artifact, or lore-cli Backlog.md-corpus document was opened. No product source, runtime dependency, executable scaffolding, package manifest, or release artifact was added.

Out-of-scope discovery (not acted on, reported per instructions): none found. This task's own dependencies (QCLI-2.2, QCLI-2.3, QCLI-2.4) were all already Done and internally consistent with each other and with the charter/register/ledger at the time of reading; no drift or defect was observed in them during this task's research.
<!-- SECTION:NOTES:END -->
