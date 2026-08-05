---
id: QCLI-7
title: >-
  Enumerate the campaign Story in the research-source-register's 'Prior QCLI
  research records' slice
status: In Progress
assignee: []
created_date: '2026-08-05 03:25'
updated_date: '2026-08-05 03:25'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - campaign
  - wave-2
dependencies:
  - QCLI-6
  - QCLI-2.8
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.8's own settlement-pass caveat (docs/reference/quest-cli-component-contracts-and-delivery-graph.md, 'Reconciliation across the ten dependencies') names three of its Provenance-table sources as not yet enumerated in the register's 'Prior QCLI research records' slice: QCLI-2.5's Backlog migration fidelity contract, QCLI-2.6's Git/filesystem/concurrency threat model, and the campaign Story itself (docs/stories/prepare-quests-clean-room-research-foundation.md, cited in QCLI-2.8's own Provenance table as principal grounding). QCLI-6 closed the first two; the Story remains unenumerated in the register after that task. This is the identical enumeration-gap class the campaign has now closed twice (QCLI-2.12, then QCLI-6) -- leaving the Story open recreates the same debt for a third time.

This task resolves the Story's status one way or the other: either admit it as a register member (pinned per the campaign's standing self-pin/SHA-pin rule -- see QCLI-2.12's task notes and PR #17), or state explicitly in the register why Stories are out of scope for that slice's admission authority. Whichever outcome is chosen, QCLI-2.8's caveat must be reconciled against it so it stays accurate.

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12 and QCLI-6 operated under. No product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The register's 'Prior QCLI research records' slice either gains a correctly pinned entry for the campaign Story (self-pinned to its own current state if co-edited by this task's own passes, SHA-pinned to a specific commit otherwise), or the register explicitly states that Stories are out of scope for that slice's admission authority, with reasoning
- [ ] #2 QCLI-2.8's caveat at quest-cli-component-contracts-and-delivery-graph.md is updated (if the gap closed) or confirmed still accurate (if Stories were ruled out of scope) against whichever outcome AC1 produced
- [ ] #3 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #4 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->
