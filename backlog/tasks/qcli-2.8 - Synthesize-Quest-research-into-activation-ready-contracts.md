---
id: QCLI-2.8
title: Synthesize Quest CLI research into activation-ready component contracts
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 22:10'
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

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: normative output is limited to Quest CLI component contracts; product-wide changes require quest-doc acceptance.
---
<!-- COMMENTS:END -->
