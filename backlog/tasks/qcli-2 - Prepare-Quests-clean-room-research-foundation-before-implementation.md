---
id: QCLI-2
title: Prepare Quest's clean-room research foundation before implementation
status: Done
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 23:56'
labels:
  - campaign
  - quest
  - research
  - clean-room
  - no-implementation
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Continue the independently authored research campaign transferred from the former opum-cli repository. This parent authorizes provenance work, requirements research, planning, Lore documentation, and non-executable black-box scenarios only; it does not authorize product source, runtime dependencies, executable scaffolding, package publication, or contracts that depend on unfinished Lore evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every research input has an exact provenance classification and permitted use
- [x] #2 Approved legacy Opum intent and observable prototype defects become independently authored Quest workflows, invariants, threats, migration requirements, and black-box scenarios
- [x] #3 The final synthesis distinguishes evidence-complete contracts from Lore-dependent or owner-dependent blockers and leaves implementation tasks inactive
- [x] #4 No task adds product source, runtime dependencies, executable scaffolding, packages, or releases before the Lore implementation gate
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Settlement (orchestrator, wave 5 — campaign complete). All 14 subtasks (QCLI-2.1 through QCLI-2.14) are Done, each independently reviewed and its own ACs confirmed against live evidence. This parent's own 4 ACs are settled against specific completed deliverables, not mechanically inferred from "all children Done":

AC1 (provenance classification) — docs/reference/quest-cli-research-source-register.md is the per-slice admission authority (established QCLI-2.1, extended QCLI-2.7, coherence-corrected QCLI-2.11/2.12); every source cited across all 14 subtasks was checked against it, and every reviewer this campaign independently re-verified that citations drew only from Allowed slices for the specific use cited — confirmed as recently as wave 5's two reviews.

AC2 (legacy intent + prototype defects -> Quest artifacts) — QCLI-2.2 (16-candidate legacy Opum reconciliation), QCLI-2.3 (17 black-box scenarios from prototype failures), QCLI-2.4 (actor/workflow/domain-language glossary), QCLI-2.6 (5 invariants, 13-row threat catalog), QCLI-2.5/QCLI-2.10 (migration fidelity contract + adoption playbook) — all independently authored, none derived from Backlog.md or legacy Opum implementation source per the clean-room gate.

AC3 (final synthesis distinguishes evidence-complete from blocked, leaves implementation inactive) — QCLI-2.8's docs/reference/quest-cli-component-contracts-and-delivery-graph.md: 7 functional component contracts plus 7 explicit unresolved-decision categories (licensing, runtime, platform, ID grammar, scale, governance, archival), each with a stated status (open/owner-held, blocked, etc.); the delivery graph (Phases 0-6) is explicitly non-normative and dormant, gated on the owner-held Lore release gate, and its closing paragraph states no Backlog task is created, assigned, or activated by this document. Independently confirmed by wave 5's reviewer.

AC4 (no product source/runtime deps/scaffolding/releases before the Lore gate) — maintained across all 14 subtasks and every wave's repository-inventory checks; this repo holds only instructions, Backlog/Lore configuration, task records, and documentation. No package.json, no bin entry, no install instructions, no package reservation, no release — confirmed as recently as wave 5's reviews of QCLI-2.8 and QCLI-2.10.

One real coherence gap remains, out of scope for every individual subtask and therefore not blocking this parent's own ACs (none of which require register enumeration completeness as a precondition): the register's "Prior QCLI research records" slice does not yet enumerate QCLI-2.5, QCLI-2.6, QCLI-2.8, QCLI-2.9, or QCLI-2.10 as members, despite being relied on by merged deliverables — the same gap class QCLI-2.12 closed for other documents. Proposed as a follow-up task in the campaign doc; not created without owner approval.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Prepared Quest CLI's clean-room research foundation across 5 waves and 14 subtasks: provenance revalidation and an admission-authority register (2.1, 2.7, 2.11, 2.12), legacy requirement reconciliation and packaging resolution (2.2, 2.9), black-box scenarios and domain glossary (2.3, 2.4), a Git/filesystem/concurrency threat model (2.6), a Backlog migration fidelity contract and adoption playbook (2.5, 2.10), a moving-reference convention and scope re-homing (2.13, 2.14), and a final synthesis into activation-ready component contracts and a dormant, Lore-gated delivery graph (2.8). Every research input traces to an admitted source; no product source, runtime dependency, executable scaffolding, package, or release was introduced anywhere in the campaign. Zero implementation tasks are active — all remain gated on the owner-held Lore release evidence check.

One real coherence gap (register enumeration incompleteness for several already-relied-upon research outputs) surfaced by the final wave's integration review remains open, proposed as a follow-up task pending owner approval — it does not affect any subtask's or this parent's own settled acceptance criteria.
<!-- SECTION:FINAL_SUMMARY:END -->
