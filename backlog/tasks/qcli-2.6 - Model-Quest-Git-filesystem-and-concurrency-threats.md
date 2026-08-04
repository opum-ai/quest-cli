---
id: QCLI-2.6
title: 'Model Quest Git, filesystem, and concurrency threats'
status: In Progress
assignee:
  - '@jeremy-newhouse'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 16:48'
labels:
  - campaign
  - research
  - threat-model
  - git
  - concurrency
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:threat-model'
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
