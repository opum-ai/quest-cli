---
id: QCLI-2.2
title: Reconcile legacy Opum requirements into Quest CLI candidates
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 13:04'
labels:
  - campaign
  - research
  - requirements
  - legacy
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:requirements'
  - wave-2
  - in-review
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extract component-relevant functional intent from admitted legacy Opum decisions and task narratives, then classify it as Quest CLI contract candidates. Work only from admitted authored requirements and observable narratives; do not inspect or port legacy implementation source or tests. Route every product-wide vocabulary, execution-graph, architecture, or roadmap change to the canonical quest-doc specification.

Scope boundary for wave 2 (2026-08-04, restore #2): QCLI-2.7 and QCLI-2.9 run concurrently. QCLI-2.7 owns all edits to docs/reference/quest-cli-research-source-register.md this wave — cite it read-only, do not edit it. Your deliverable is a new reference document of your own. The register is the admission authority: a source may inform a QCLI requirement only if the register classifies it Allowed. Read it before citing anything.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source-attributed matrix covers every admitted legacy decision, specification, guide, task narrative, and prototype review used
- [ ] #2 Each component candidate is classified reusable, adapted, superseded, deferred, or rejected against the current Quest, Lore, and Opum boundaries
- [ ] #3 Any change to Quest-wide semantics, vocabulary, architecture, or roadmap is proposed to quest-doc and is not treated as normative in quest-cli
- [ ] #4 The result preserves supported CLI execution invariants while rejecting the former product name, repository home, and command namespace
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the register (read-only, owned by QCLI-2.7 this wave), the component charter, and the migration ledger; confirm OCLI-3.2 (opum-doc) is the sole content predecessor per the ledger row.
2. In opum-doc, read OCLI-3.2's own task narrative plus its coupled historical Spec/Story/Runbook and OCLI-3 (parent); confirm the named legacy artifacts in OCLI-3.2 AC1 (ADR-042, SPEC-FEAT-011, legacy usage guide/research digest, OPUM-328, OPUM-338-342) are absent from opum-doc and unmentioned in the register/dated inventory -- treat as an unlocatable/not-admitted finding, not a source to fabricate from.
3. Build a source-attributed matrix (AC1) covering every admitted legacy decision/spec/guide/task-narrative/prototype-review actually used: OCLI-3.2 and OCLI-3 task narratives, the historical Spec/Story/Runbook, the dated Opum fleet and prior-art inventory (Allowed) as the prototype-review input, and quest-cli's own component ADR/charter/register as current-boundary authority.
4. Classify each component candidate named in OCLI-3.2's AC3/AC4 (event-derived state, explicit workspaces, Git CAS claims, TTL leases, accountable-human delegation, human gates, deterministic JSON/exits, read-only purity, operation-owned commits, canonical task identity, Backlog-as-authority, Python/opum-engine product home, opum-pm command nesting, hosted-services/RBAC/MCP/dashboard/explorer/broad-platform scope, opum-engine prototype PR surfaces) as reusable/adapted/superseded/deferred/rejected against the current Quest/Lore/Opum boundaries in the charter (AC2).
5. Add an explicit routing section: any candidate touching Quest-wide vocabulary/architecture/roadmap is a proposal to quest-doc, non-normative here (AC3).
6. Add an explicit AC4 section citing the accepted component ADR and register: preserved supported CLI execution invariants vs. rejected former product name (Opum/opum), repository home (opum-cli/opum-doc), and command namespace (opum pm nesting).
7. Scaffold the new Reference doc with 'lore new reference', author prose outside managed blocks, run lore sync then check/validate/orphans --strict --plain, fix findings.
8. Record decisions, sources admitted/rejected, and literal gate output in --append-notes; commit in small logical commits with a Refs: QCLI-2.2 trailer; push the branch last.
<!-- SECTION:PLAN:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: scope is now limited to Quest CLI component candidates; quest-doc remains the sole product-wide decision owner.
---
<!-- COMMENTS:END -->
