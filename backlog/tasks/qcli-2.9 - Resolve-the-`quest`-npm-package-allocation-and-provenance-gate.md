---
id: QCLI-2.9
title: Resolve the `quest` npm package allocation and provenance gate
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 23:48'
updated_date: '2026-08-04 13:06'
labels:
  - research
  - packaging
  - npm
  - provenance
  - registry
  - follow-up
  - no-publication
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - campaign
  - 'cluster:packaging'
  - wave-2
  - merge-pending
dependencies:
  - QCLI-2.1
references:
  - ../opum-doc/docs/reference/cross-product-documentation-authority-audit.md
documentation:
  - docs/adr/use-quest-cli-for-the-quest-package-and-command.md
  - docs/reference/quest-cli-component-charter.md
  - docs/specs/quest-cli-pre-implementation-research-program.md
  - docs/stories/prepare-quests-clean-room-research-foundation.md
  - docs/reference/quest-cli-packaging-contract.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Resolve the component-owned naming uncertainty before Quest package metadata or install copy is frozen. Recheck the npm registry and relevant provenance after QCLI-2.1, classify any existing package or ownership constraints, and record an owner-approved unscoped name or scoped fallback while keeping the executable quest. This research task authorizes no reservation, transfer, publication, or release.

Owner direction, 2026-08-04 (restore #2) — THE NAME DECISION IS ALREADY MADE. Do not reopen it. The owner decided on 2026-08-04 that quest-cli publishes as the scoped @opum-ai/quest with the executable still quest, and QCLI-5 already amended the component charter, the component ADR, the source register, and the migration ledger to that identity. The repository transfer to opum-ai/quest-cli is executed and verified.

This task therefore shifts from DECIDING the name to EVIDENCING and RECORDING it. All five acceptance criteria remain satisfiable as written; read AC3 "scoped fallback" as the already-accepted @opum-ai/quest. Concretely: produce the dated registry evidence AC1 requires (ownership, maintainers, package history, allocation/transfer constraints, and the mandatory release-time recheck), classify provenance per AC2, record the accepted name in a component packaging contract per AC3, keep every public claim conditional on immutable release evidence per AC4, and take no registry action whatsoever per AC5.

If the evidence you gather contradicts the decision, do not act on it and do not reverse it. Record the contradiction in task notes and report it — the owner decides.

Scope boundary for wave 2: QCLI-2.7 owns all edits to docs/reference/quest-cli-research-source-register.md this wave. Cite the register read-only; do not edit it. Your deliverable is a new packaging-contract document.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dated registry evidence records current ownership, maintainers, package history, allocation or transfer constraints, owner-approved scoped fallbacks, and a mandatory release-time recheck for the preferred quest package name
- [ ] #2 Licensing, contributor, and artifact provenance for any existing package or content is classified, and ambiguous or unadmitted content is not reused
- [ ] #3 The accepted unscoped name or scoped fallback is recorded in the component packaging contract while the executable remains quest
- [ ] #4 Package metadata, install copy, and public claims remain conditional on immutable protected release evidence
- [ ] #5 No package reservation, transfer, publication, remote-policy change, or release occurs without separate explicit owner authorization
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the source register, component charter, and ADR (owner already decided @opum-ai/quest on 2026-08-04 per QCLI-5) — cite read-only, do not edit the register (QCLI-2.7 owns it this wave).
2. Independently re-run live npm view / gh api registry evidence (quest, quest-cli, @opum-ai/quest, @opum-ai/quest-cli, @salient-data/quest[-cli], lore, lore-cli, @opum-ai/lore) and verify the opum-ai/quest-cli transfer identity (git remote -v, gh api against both org paths, checking for the stale-redirect trap) — date and command every observation.
3. Author a new Reference doc docs/reference/quest-cli-packaging-contract.md via 'lore new reference' covering: AC1 dated evidence + mandatory release-time recheck clause, AC2 provenance classification (citing the register's existing Excluded/Allowed calls, no source reuse), AC3 recorded @opum-ai/quest identity with executable quest, AC4 conditional public-claim language tied to the ADR's protected-immutable-release consequence, AC5 explicit no-registry-action statement.
4. Run lore sync then lore check --strict / lore validate --strict / lore orphans and capture real output.
5. Record dated evidence and gate output in task notes; report any contradictions (none expected) without acting on them.
<!-- SECTION:PLAN:END -->
