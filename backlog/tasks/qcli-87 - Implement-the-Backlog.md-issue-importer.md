---
id: QCLI-87
title: Implement the Backlog.md issue importer
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 11:56'
labels:
  - quest-0.1
  - 'wave:migration'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-73
  - QCLI-86
documentation:
  - docs/reference/quest-cli-backlog-migration-fidelity-contract.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/migration/backlog/
  - test/fixtures/backlog/
  - test/integration/migration/backlog.test.ts
priority: high
type: feature
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement full current-state adoption of Backlog task records through the requalified public contract. The source repository remains untouched, Quest mints fresh canonical IDs, and imported source identities and Git provenance remain reversible.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Active, completed, archived, and draft records are completely inventoried, including cross-folder duplicate IDs
- [ ] #2 Hierarchy, dependencies, milestones, status, priority, type, assignees, labels, criteria, plans, notes, summaries, comments, references, documentation, modified files, and timestamps follow the approved fidelity matrix
- [ ] #3 Every imported task receives a namespaced source alias and receives the raw familiar ID only when globally unambiguous
- [ ] #4 Source commit and blob hashes are preserved while no lifecycle events are fabricated from Git history
- [ ] #5 Preview, direct cutover, shadow refresh, source drift, rollback, and byte-identical source fingerprint tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Revalidate the current public Backlog record layout and map it to QCLI-86 source-neutral migration contracts. 2. Implement a read-only Backlog source adapter with complete lifecycle inventory, source-qualified identity, provenance, fidelity mapping, and aliases. 3. Use preflight and post-apply source fingerprints plus automatic compensation of unchanged migration-owned target records to detect and remediate source drift; an operational freeze remains a documented precondition, not a technical lease. 4. Add fixture-based integration coverage for preview, cutover, shadow refresh, source drift, rollback, and source immutability. 5. Run adapter, migration, type, layer, formatting, and cumulative qualification.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner approved detectable source drift with mandatory compensation; do not model Backlog as supplying an atomic lock or CAS lease.
<!-- SECTION:NOTES:END -->
