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
status: todo
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
| [QCLI-72](../../backlog/tasks/qcli-72%20-%20Reconcile-and-freeze-the-Quest-0.1-implementation-baseline.md) | Reconcile and freeze the Quest 0.1 implementation baseline | Done |
| [QCLI-73](../../backlog/tasks/qcli-73%20-%20Requalify-Backlog.mds-public-migration-surface.md) | Requalify Backlog.md's public migration surface | Done |
| [QCLI-74](../../backlog/tasks/qcli-74%20-%20Qualify-jira-cli-and-freeze-Jira-migration-fidelity-mappings.md) | Qualify jira-cli and freeze Jira migration fidelity mappings | Done |
| [QCLI-75](../../backlog/tasks/qcli-75%20-%20Scaffold-the-Lore-aligned-Bun-package-and-architecture.md) | Scaffold the Lore-aligned Bun package and architecture | To Do |
| [QCLI-76](../../backlog/tasks/qcli-76%20-%20Implement-Quest-configuration-command-results-diagnostics-and-manifest.md) | Implement Quest configuration, command results, diagnostics, and manifest | To Do |
| [QCLI-77](../../backlog/tasks/qcli-77%20-%20Implement-authored-codecs-actors-IDs-aliases-events-and-replay.md) | Implement authored codecs, actors, IDs, aliases, events, and replay | To Do |
| [QCLI-78](../../backlog/tasks/qcli-78%20-%20Implement-safe-Quest-workspace-initialization-discovery-and-enrollment.md) | Implement safe Quest workspace initialization, discovery, and enrollment | To Do |
| [QCLI-79](../../backlog/tasks/qcli-79%20-%20Implement-operation-owned-Git-CAS-synchronization-and-crash-recovery.md) | Implement operation-owned Git CAS, synchronization, and crash recovery | To Do |
| [QCLI-80](../../backlog/tasks/qcli-80%20-%20Implement-the-Quest-task-graph-lifecycle-CRUD-search-and-readiness.md) | Implement the Quest task graph, lifecycle, CRUD, search, and readiness | To Do |
| [QCLI-81](../../backlog/tasks/qcli-81%20-%20Implement-Quest-claims-leases-heartbeats-reclamation-and-delegation.md) | Implement Quest claims, leases, heartbeats, reclamation, and delegation | To Do |
| [QCLI-82](../../backlog/tasks/qcli-82%20-%20Implement-Quest-gates-review-evidence-and-completion-enforcement.md) | Implement Quest gates, review evidence, and completion enforcement | To Do |
| [QCLI-83](../../backlog/tasks/qcli-83%20-%20Ship-the-Quest-tracker-subprocess-contract-and-Lore-conformance-kit.md) | Ship the Quest tracker subprocess contract and Lore conformance kit | To Do |
| [QCLI-84](../../backlog/tasks/qcli-84%20-%20Implement-the-Bun-SQLite-projection-schema-and-atomic-rebuild.md) | Implement the Bun SQLite projection schema and atomic rebuild | To Do |
| [QCLI-85](../../backlog/tasks/qcli-85%20-%20Implement-incremental-projection-sync-freshness-queries-and-scale.md) | Implement incremental projection sync, freshness, queries, and scale | To Do |
| [QCLI-86](../../backlog/tasks/qcli-86%20-%20Implement-the-generic-Quest-migration-transaction-engine.md) | Implement the generic Quest migration transaction engine | To Do |
| [QCLI-87](../../backlog/tasks/qcli-87%20-%20Implement-the-Backlog.md-issue-importer.md) | Implement the Backlog.md issue importer | To Do |
| [QCLI-88](../../backlog/tasks/qcli-88%20-%20Implement-Backlog-knowledge-partitioning-and-the-Quest-Lore-migration-saga.md) | Implement Backlog knowledge partitioning and the Quest-Lore migration saga | To Do |
| [QCLI-89](../../backlog/tasks/qcli-89%20-%20Implement-the-Jira-Cloud-importer-through-jira-cli.md) | Implement the Jira Cloud importer through jira-cli | To Do |
| [QCLI-90](../../backlog/tasks/qcli-90%20-%20Implement-optional-Lore-concept-linking.md) | Implement optional Lore concept linking | To Do |
| [QCLI-91](../../backlog/tasks/qcli-91%20-%20Qualify-Quest-migrations-and-Lore-interoperation-end-to-end.md) | Qualify Quest migrations and Lore interoperation end to end | To Do |
| [QCLI-92](../../backlog/tasks/qcli-92%20-%20Build-six-compiled-Quest-platform-packages-and-the-npm-launcher.md) | Build six compiled Quest platform packages and the npm launcher | To Do |
| [QCLI-93](../../backlog/tasks/qcli-93%20-%20Complete-Quest-release-fault-clone-scale-and-supply-chain-qualification.md) | Complete Quest release, fault, clone, scale, and supply-chain qualification | To Do |
| [QCLI-94](../../backlog/tasks/qcli-94%20-%20Publish-Quest-operator-migration-recovery-and-release-runbooks.md) | Publish Quest operator, migration, recovery, and release runbooks | To Do |
| [QCLI-95](../../backlog/tasks/qcli-95%20-%20Publish-opum-ai-quest-0.1.0.md) | Publish @opum-ai/quest 0.1.0 | To Do |
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
