---
id: QCLI-8
title: >-
  Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration gap QCLI-6
  already closed
status: In Progress
assignee: []
created_date: '2026-08-05 04:32'
updated_date: '2026-08-05 04:32'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - campaign
  - wave-3
dependencies:
  - QCLI-6
  - QCLI-2.10
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md (QCLI-2.10's own deliverable) is stale in two places about the research-source-register's 'Prior QCLI research records' slice, both predating QCLI-6:

1. A narrative caveat paragraph (around line 431) stating the register's slice 'lists nine specific members ... and the fidelity contract is not one of them' -- false since QCLI-6: the slice now enumerates fourteen members, including QCLI-2.5's Backlog migration fidelity contract, SHA-pinned.
2. The Sources table's own 'Register classification' cell for the QCLI-2.5 row (around line 426), which points a reader at the now-stale caveat below it as the reason the contract isn't enumerated. This is arguably the worse staleness of the two, since it is a load-bearing classification claim rather than narrative prose.

This is the same reconciliation pattern QCLI-7 already applied to QCLI-2.8's stale caveat: append a dated 'Resolved' note stating the current, correct state, and preserve the original text as the historical record of what that document's own settlement pass found (per this repo's inline-supersession convention -- do not delete or silently rewrite the original).

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12, QCLI-6, and QCLI-7 all operated under. No product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both stale references in quest-cli-backlog-adoption-and-migration-playbook.md (the narrative caveat paragraph and the Sources table's Register classification cell for the QCLI-2.5 row) are reconciled against the register's current state (fourteen members; QCLI-2.5's fidelity contract SHA-pinned since QCLI-6), with the original text preserved as historical record and a dated resolution note appended
- [ ] #2 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #3 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->
