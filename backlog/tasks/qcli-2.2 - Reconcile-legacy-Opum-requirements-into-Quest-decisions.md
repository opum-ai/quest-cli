---
id: QCLI-2.2
title: Reconcile legacy Opum requirements into Quest CLI candidates
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 13:09'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deliverable: docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md (new Reference, scaffolded via 'lore new reference').

Admitted sources used (all Allowed per the read-only register, cited not edited): OCLI-3.2 and OCLI-3 task narratives in opum-doc (gated by migration ledger rows OCLI-3.2->QCLI-2.2 and OCLI-3->QCLI-2), their coupled historical Spec/Story/Runbook (historical-ocli-pre-release-research-program.md, historical-ocli-clean-room-research-origin.md, historical-ocli-research-campaign-handover.md), the dated Opum fleet and prior-art inventory (Allowed; used as the AC1 prototype-review input for the jeremy-newhouse/opum-engine PR heads and 11 scenario seeds, both left Deferred), and this repo's own component charter, migration ledger, accepted ADR, and research-program spec.

Key finding (recorded as an out-of-scope discovery per the coordinator's instructions): OCLI-3.2's own AC1 names five legacy artifacts as its intended evidence base -- ADR-042, SPEC-FEAT-011, 'the legacy usage guide/research digest', OPUM-328, and OPUM-338 through OPUM-342. A case-insensitive grep across the entire opum-doc working tree (HEAD d7ca18f) found zero matches outside OCLI-3.2's own task file; none are named in the source register or the dated fleet inventory either. Per the register's own admission rule ('no source slice informs a QCLI requirement unless it is listed here as Allowed'), these five artifacts are rejected from this reconciliation for lack of an admitted, locatable source -- not searched for in Quarantined/Deferred territory, since that would itself violate the admission rule. Flagged for the owner via opum-doc's OCLI-7 (legacy evidence disposition, still To Do).

Classification (AC2): built a 16-row candidate matrix. Reusable: deterministic JSON/exit behavior, operation-owned commits (both already independently owned by the current charter). Adapted: event-derived state, explicit workspaces, Git CAS claims, TTL leases, the gate mechanism (excluding actor semantics), read-only purity, canonical task identity -- concepts carried forward, no legacy design ported. Superseded: Backlog-as-authority, Python/opum-engine as product home. Rejected: the old 'opum pm' command nesting (AC4), and the five unlocatable artifacts above. Deferred: hosted services/RBAC/MCP/dashboard/explorer/broad platform scope, and the opum-engine prototype PR surfaces.

AC3 routing: exactly one candidate (accountable-human delegation / actor responsibilities) crosses into Quest-wide actor-model territory per the charter's own closing sentence; the document explicitly declines to classify it as a quest-cli-normative decision and routes it to quest-doc, without authoring anything into quest-doc itself.

AC4: rejected former product name (Opum/opum package), former repository home (opum-cli, not the Quest implementation home per the register; current opum-ai/quest-cli origin re-verified live), and former command namespace (opum pm nesting), while listing which CLI execution invariants are preserved as independently-authored candidates only (no schema/format frozen).

Gates (all run from this worktree, literal output):
lore sync --plain: 'updated docs/log.md / updated docs/reference/index.md / updated docs/stories/audit-quest-cli-documentation-authority.md / committed backlog/: 1 file / 3 files changed' -- the Story status/managed-block reconciliation for QCLI-5 (already Done) was pre-existing drift unrelated to this task's edits, picked up by sync's normal whole-bundle reconciliation.
lore check --strict --plain: '17 files, 0 errors, 0 warnings' (exit 0)
lore validate --strict --plain: '17 files, 0 errors, 0 warnings, 6 skipped' (exit 0)
lore orphans --plain: 'orphans: 0 orphan tasks, 0 dangling links' (exit 0)

Did not edit docs/reference/quest-cli-research-source-register.md (QCLI-2.7's this wave) or any file outside this task's own new document and its own Backlog task record. Did not open Backlog.md source, the local Backlog.md clone, or any Quarantined/Excluded artifact.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: scope is now limited to Quest CLI component candidates; quest-doc remains the sole product-wide decision owner.
---
<!-- COMMENTS:END -->
