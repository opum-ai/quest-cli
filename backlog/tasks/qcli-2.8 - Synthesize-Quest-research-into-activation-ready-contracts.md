---
id: QCLI-2.8
title: Synthesize Quest CLI research into activation-ready component contracts
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 22:18'
labels:
  - campaign
  - research
  - synthesis
  - contracts
  - activation-gate
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:synthesis'
dependencies:
  - QCLI-2.2
  - QCLI-2.3
  - QCLI-2.4
  - QCLI-2.5
  - QCLI-2.6
  - QCLI-2.7
  - QCLI-2.11
  - QCLI-2.12
  - QCLI-2.13
  - QCLI-2.14
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate admitted research into reviewed, implementation-independent Quest CLI component contracts and a proposed component delivery graph that can activate only after the owner-held Lore release gate. Preserve provenance, leave evidence-dependent choices open, and route any Quest-wide contract change to quest-doc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every component requirement and scenario traces to the revalidated provenance register or an approved research output
- [ ] #2 CLI identity, lifecycle, JSON and exits, Git mutation, migration, projection, and Lore integration are specified functionally without copying excluded implementation
- [ ] #3 Unresolved licensing, runtime, platform, ID grammar, scale, governance, and archival choices remain explicit component decisions, product-owner proposals, or blockers
- [ ] #4 Any Quest-wide semantic change is routed to quest-doc; all implementation tasks remain unassigned and inactive until canonical activation evidence passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Research complete: read this repo's own register, charter, ADR, migration ledger, research-program Spec, Story, and all ten in-scope dependency deliverables in full (not summary): QCLI-2.2 legacy-opum-requirement-reconciliation-for-quest-cli.md, QCLI-2.3 quest-cli-black-box-acceptance-scenarios.md, QCLI-2.4 quest-cli-component-glossary-actors-and-workflows.md, QCLI-2.5 quest-cli-backlog-migration-fidelity-contract.md, QCLI-2.6 quest-cli-git-filesystem-and-concurrency-threat-model.md, QCLI-2.7 quest-cli-lore-dependency-and-adapter-contract-evidence.md (QCLI-2.11/2.12/2.13/2.14 are correction tasks against these same documents plus the register/ledger/Spec, already merged -- read their corrected live text, not the correction tasks' own notes). Live-re-verified LDOC-4 (lore-doc) and LCLI-278 (lore-cli) both still To Do in the local clones on 2026-08-04, consistent with QCLI-2.7's Part 1 finding -- the Lore-owned release gate remains unpassed.
2. Scaffold docs/reference/quest-cli-component-contracts-and-delivery-graph.md via 'lore new reference'.
3. Author: (a) a provenance/grounding table citing all ten dependency deliverables plus the register, charter, ADR, ledger, and Spec, each with revision and what it contributes; (b) a scope/authorship-boundary section restating the component-vs-product-wide line and re-affirming legacy candidate #6's (accountable-human/actor-model) existing routing to quest-doc, not reopening it; (c) an activation-gate/dormancy section citing QCLI-2.7's Part 1 matrix and Activation handover requirement verbatim in structure (not restating the mutable gate predicate), with a recheck clause per the Spec's moving-vs-immutable convention naming the exact LDOC-4/LCLI-278 commands to re-run; (d) seven functional component contracts per AC2 -- CLI identity, lifecycle, JSON and exits, Git mutation, migration, projection, and Lore integration -- each grounded in the cited dependencies, stated as required behavior/invariants without freezing a schema, command name, or copying any excluded implementation; (e) an explicit unresolved-decisions section per AC3 covering licensing, runtime, platform, ID grammar, scale, governance, and archival, each labeled open question / component decision / product-owner proposal / blocker with citation to the Spec's Open Questions, QCLI-2.7's cession language (as corrected by QCLI-2.14), and QCLI-2.2's candidate #6 routing; (f) a proposed component delivery graph: a dormant, explicitly non-normative table/graph of candidate implementation phases mapped to the seven contract areas and their blockers, stating plainly that no task in it is created, assigned, or active, and that activation requires both the Lore gate passing and live re-verification per the Activation handover requirement; (g) an AC4 routing section consolidating candidate #6 and confirming no other content proposes a Quest-wide change; (h) a reconciliation section noting the cross-task corrections QCLI-2.11/2.12/2.13/2.14 already made are verified consistent in the live text this document cites, and recording the register's silence on process-level-response evidence classification (already used by QCLI-2.5) as an out-of-scope finding, not fixed here; (i) a closing Notes/independence section in the house style.
4. Run 'lore validate --strict' and 'lore check --strict' against the new file iteratively while drafting; run 'lore sync' exactly once as the final content step; re-run 'lore check --strict', 'lore validate --strict', and 'lore orphans' from the worktree root as the closing gate.
5. Record notes (sources checked against the register, decisions, literal gate output) via --append-notes; report the out-of-scope register-silence finding via --comment.
6. Commit in small logical commits with 'Refs: QCLI-2.8' trailers; push feat/qcli-2.8-synthesis-component-contracts as the last action. Do not check ACs, write a final summary, move status, or touch the register/ledger/campaign doc.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-component-contracts-and-delivery-graph.md (new Reference, scaffolded via 'lore new reference', 721 lines): the top-level synthesis of QCLI-2.2-2.7's six deliverables (as corrected live by QCLI-2.11/2.12/2.13/2.14) into seven functional component contracts, a seven-item unresolved-decisions list, and a proposed dormant delivery graph.

Sources read in full (not summary, not memory) before drafting: this repo's research source register, component charter, accepted ADR, migration ledger, research-program Spec, and the Story; and the live text of all six named dependency deliverables -- QCLI-2.2 legacy-opum-requirement-reconciliation-for-quest-cli.md, QCLI-2.3 quest-cli-black-box-acceptance-scenarios.md, QCLI-2.4 quest-cli-component-glossary-actors-and-workflows.md, QCLI-2.5 quest-cli-backlog-migration-fidelity-contract.md, QCLI-2.6 quest-cli-git-filesystem-and-concurrency-threat-model.md, QCLI-2.7 quest-cli-lore-dependency-and-adapter-contract-evidence.md. QCLI-2.11/2.12/2.13/2.14 produced no separate deliverable to read; verified their corrections are present in the live text of the register, the migration ledger, the Spec, and QCLI-2.2/2.3/2.4/2.7's documents directly (846f054^ attribution now 3023468; Backlog-corpus catch-all unified to one formulation; every d7ca18f citation checked reads as a dated pin; QCLI-2.7's Part 1 no longer cedes runtime/platform evidence to QCLI-2.9; the Spec's moving-vs-immutable convention and its mutual cross-reference with the register are present). Did not read QCLI-2.9's packaging contract as a cited source (not one of this task's ten named dependencies); cited the register's own npm-identity slices directly instead, per this task's instruction that every claim trace to a dependency deliverable or to the register directly.

Live re-verification performed independently of QCLI-2.7's own dated observation: 'backlog task view LDOC-4 --plain' in /Volumes/external/repos/lore-doc -> To Do (unchanged); 'backlog task view LCLI-278 --plain' in /Volumes/external/repos/lore-cli -> To Do (unchanged). Both read-only, both local clones untouched. The Lore-owned release gate remains unpassed as of 2026-08-04; the document's Activation gate and dormancy section names this and adds a recheck clause per the Spec's moving-vs-immutable-references convention naming the exact commands a later worker/activation session must re-run.

AC1: every requirement/scenario in the document traces to the register or to one of the ten dependency deliverables -- verified by citation audit while drafting (every functional-contract bullet and every unresolved-decision item carries an inline citation to a specific document/slice/candidate/scenario ID).

AC2: seven functional contracts authored in the exact AC2 order (CLI identity, lifecycle, JSON and exits, Git mutation, migration, projection, Lore integration), each stating required behavior/invariants only -- no schema, command name, flag, file layout, or algorithm frozen, and no Backlog.md/legacy-Opum implementation cited or copied. Git mutation restates QCLI-2.6's five named invariants (INV-1..INV-5) verbatim per that document's own naming, without duplicating its full threat catalog.

AC3: seven unresolved-decision categories (licensing, runtime, platform, ID grammar, scale, governance, archival) each labeled open question / component decision / product-owner proposal / blocker with citation to the Spec's Open Questions, the register, QCLI-2.2's candidate #6 routing, QCLI-2.4's corroboration, and QCLI-2.14's runtime/platform correction. Archival is split into (a) Quest's own open record-archival design question and (b) opum-doc's separate, owner-held OCLI-7 legacy-evidence-retention decision, kept distinct rather than conflated.

AC4: 'Routing to quest-doc and inactive status' section re-affirms candidate #6's existing routing (not a new finding) and states plainly that this document creates, assigns, or activates no implementation task -- every phase of the proposed delivery graph is dormant pending the Lore gate passing and live re-verification.

Gates (worktree root, after the single terminal 'lore sync' run, re-verified after committing the regenerated docs/ files):
- lore check --strict --plain -> '24 files, 0 errors, 0 warnings' (exit 0)
- lore validate --strict --plain -> '24 files, 0 errors, 0 warnings, 6 skipped' (exit 0)
- lore orphans --plain -> '0 orphan tasks, 0 dangling links' (exit 0)
Pre-sync, 'lore check --strict' showed the expected status-drift/managed-block-drift errors on the Story caused by marking this task In Progress -- resolved by the single terminal 'lore sync' run, consistent with this campaign's established convention.

Scope discipline: did not edit the source register or the migration ledger (out of this task's scope per its own instructions); did not touch QCLI-2.9's or QCLI-2.10's files, the campaign doc, or any other sibling task's document; did not check any acceptance criterion, write a final summary, or move status. No product source, runtime dependency, executable scaffolding, package manifest, or release artifact was added; no Backlog.md implementation source/tests, legacy Opum implementation source, or Quarantined artifact was opened.

Noted, not acted on: this branch's merge-base with dev (f39ff5c) predates a later wave-5 dispatch commit on dev (3a21d5b) that also touched QCLI-2.8's and QCLI-2.10's own Backlog task files (assignee/label/status fields) -- a normal artifact of concurrent dispatch, not caused by this task's own edits (verified via 'git diff dev -- <path>' showing only this task's own --plan addition plus that pre-existing divergence). Not rebased or otherwise reconciled here, consistent with this task's instructions (push is the last action; reconciliation is centralized at settlement).

Out-of-scope finding (reported via --comment, not acted on): the register's 'Backlog.md public surface' slice does not explicitly name process-level responses (e.g. mcp start's stdio JSON-RPC response) as an admissible evidence class either way; QCLI-2.5's deliverable already substantively relies on this evidence under its own added enumeration clause, not the register's. Recorded in the new document's 'Reconciliation across the ten dependency deliverables' section as a residual gap for the register's owner; the register itself was not edited.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: normative output is limited to Quest CLI component contracts; product-wide changes require quest-doc acceptance.
---

author: @claude
created: 2026-08-04 22:18
---
Out-of-scope finding for the register's owner (not acted on, per this task's scope boundary: the register is not to be edited here). The research source register's "Backlog.md public surface" slice enumerates published documentation, `backlog --help`/per-command help, `--plain`/`--json` output, and on-disk artifacts produced by running the tool as the admissible evidence classes for Backlog.md -- it does not explicitly name process-level responses from running the installed binary (for example, `mcp start`'s stdio JSON-RPC response, or the equivalent HTTP responses `QCLI-2.5` also recorded from the `browser` command) as an admissible class either way. `QCLI-2.5`'s Backlog migration fidelity contract already relies on this evidence substantively (the server's self-reported version and its EOF-shutdown behavior) under an enumeration clause that document added to its own text during a wave-4 follow-up fix, not to the register's. This synthesis document's own contracts do not depend on that evidence class, so nothing in QCLI-2.8 is affected either way; flagging so the register's owner can decide whether to formalize the class explicitly.
---
<!-- COMMENTS:END -->
