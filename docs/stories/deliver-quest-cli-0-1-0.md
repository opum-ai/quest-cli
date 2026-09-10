---
type: Story
title: Deliver Quest CLI 0.1.0
tags:
  - quest
  - cli
  - implementation
  - migration
  - interop
  - release
summary: Implement and qualify the standalone Quest CLI, its Lore tracker contract, migration paths, packaging, and release gates.
timestamp: 2026-08-14T18:26:29.020Z
status: done
tasks:
  - qcli-72
  - qcli-73
  - qcli-74
  - qcli-75
  - qcli-76
  - qcli-77
  - qcli-78
  - qcli-79
  - qcli-80
  - qcli-81
  - qcli-82
  - qcli-83
  - qcli-84
  - qcli-85
  - qcli-86
  - qcli-87
  - qcli-88
  - qcli-89
  - qcli-90
  - qcli-91
  - qcli-92
  - qcli-93
  - qcli-94
  - qcli-95
---

# Deliver Quest CLI 0.1.0

## Goal

Deliver Quest CLI 0.1.0 from the frozen component contracts upward: establish the
Lore-aligned Bun foundation first, then the authored Git record and lifecycle core,
projections, migrations, tracker interoperability, packaging, qualification, and
owner-gated release. Quest remains a standalone product while exposing the versioned
subprocess contract Lore needs to use it as the default issue adapter.

## Acceptance criteria

- The implementation satisfies the [functional requirements](../specs/quest-cli-functional-requirements.md)
  through the architecture and phase gates in the
  [delivery roadmap](../specs/quest-cli-delivery-roadmap.md).
- Authored Git records remain authoritative; SQLite is disposable and rebuildable, and
  mutation, recovery, review, and delegation rules preserve the specified trust model.
- Lore can use Quest through a bounded, versioned tracker subprocess contract without
  silent initialization, migration, fallback, or dual writing.
- Existing Backlog.md issue state and Jira Cloud issues can be previewed, approved,
  adopted, verified, cut over, and compensated with explicit fidelity evidence.
- Platform packages, clean-install behavior, fault recovery, clone behavior, scale, and
  supply-chain controls pass before publication is eligible.
- Registry publication and Lore's subsequent default-backend release occur only after
  their technical gates pass and the owner explicitly authorizes each release action.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-72](../../.quest/tasks/QCLI-72.json) | Reconcile and freeze the Quest 0.1 implementation baseline | Done |
| [QCLI-73](../../.quest/tasks/QCLI-73.json) | Requalify Backlog.md's public migration surface | Done |
| [QCLI-74](../../.quest/tasks/QCLI-74.json) | Qualify jira-cli and freeze Jira migration fidelity mappings | Done |
| [QCLI-75](../../.quest/tasks/QCLI-75.json) | Scaffold the Lore-aligned Bun package and architecture | Done |
| [QCLI-76](../../.quest/tasks/QCLI-76.json) | Implement Quest configuration, command results, diagnostics, and manifest | Done |
| [QCLI-77](../../.quest/tasks/QCLI-77.json) | Implement authored codecs, actors, IDs, aliases, events, and replay | Done |
| [QCLI-78](../../.quest/tasks/QCLI-78.json) | Implement safe Quest workspace initialization, discovery, and enrollment | Done |
| [QCLI-79](../../.quest/tasks/QCLI-79.json) | Implement operation-owned Git CAS, synchronization, and crash recovery | Done |
| [QCLI-80](../../.quest/tasks/QCLI-80.json) | Implement the Quest task graph, lifecycle, CRUD, search, and readiness | Done |
| [QCLI-81](../../.quest/tasks/QCLI-81.json) | Implement Quest claims, leases, heartbeats, reclamation, and delegation | Done |
| [QCLI-82](../../.quest/tasks/QCLI-82.json) | Implement Quest gates, review evidence, and completion enforcement | Done |
| [QCLI-83](../../.quest/tasks/QCLI-83.json) | Ship the Quest tracker subprocess contract and Lore conformance kit | Done |
| [QCLI-84](../../.quest/tasks/QCLI-84.json) | Implement the Bun SQLite projection schema and atomic rebuild | Done |
| [QCLI-85](../../.quest/tasks/QCLI-85.json) | Implement incremental projection sync, freshness, queries, and scale | Done |
| [QCLI-86](../../.quest/tasks/QCLI-86.json) | Implement the generic Quest migration transaction engine | Done |
| [QCLI-87](../../.quest/tasks/QCLI-87.json) | Implement the Backlog.md issue importer | Done |
| [QCLI-88](../../.quest/tasks/QCLI-88.json) | Implement Backlog knowledge partitioning and the Quest-Lore migration saga | Done |
| [QCLI-89](../../.quest/tasks/QCLI-89.json) | Implement the Jira Cloud importer through jira-cli | Done |
| [QCLI-90](../../.quest/tasks/QCLI-90.json) | Implement optional Lore concept linking | Done |
| [QCLI-91](../../.quest/tasks/QCLI-91.json) | Qualify Quest migrations and Lore interoperation end to end | Done |
| [QCLI-92](../../.quest/tasks/QCLI-92.json) | Build six compiled Quest platform packages and the npm launcher | Done |
| [QCLI-93](../../.quest/tasks/QCLI-93.json) | Complete Quest release, fault, clone, scale, and supply-chain qualification | Done |
| [QCLI-94](../../.quest/tasks/QCLI-94.json) | Publish Quest operator, migration, recovery, and release runbooks | Done |
| [QCLI-95](../../.quest/tasks/QCLI-95.json) | Publish @opum-ai/quest 0.1.0 | Done |
<!-- lore:tasks:end -->

## Notes

The [Quest CLI architecture](../specs/quest-cli-architecture.md) defines the package and
layer boundaries. The
[open component decisions register](../reference/quest-cli-open-component-decisions.md)
must be reconciled before an affected contract is frozen.

Work proceeds in dependency order through the coupled QCLI tasks. ODOC-57 in `opum-doc`
owns the actor and delegation vocabulary consumed by the baseline task. LCLI-330 through
LCLI-332 in `lore-cli` own the public Backlog knowledge-adoption contract needed for the
full migration saga. LCLI-315.4 and LCLI-333 remain downstream of Quest publication.

The Backlog campaign tracker `doc-17` is the operational queue and journal. Live task
status and formal dependencies remain authoritative over its frontier snapshot.
