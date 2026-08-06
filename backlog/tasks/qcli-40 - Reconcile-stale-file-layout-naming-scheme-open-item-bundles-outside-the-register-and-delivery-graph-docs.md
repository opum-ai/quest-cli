---
id: QCLI-40
title: >-
  Reconcile stale "file layout"/"naming scheme" open-item bundles outside the
  register and delivery-graph docs
status: To Do
assignee: []
created_date: '2026-08-06 20:53'
labels: []
dependencies: []
references:
  - docs/adr/require-atomic-idempotent-operation-owned-mutations.md
  - docs/specs/quest-cli-architecture.md
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34 and QCLI-38 closed "file layout" and "naming scheme" (citing QCLI-25/D4) in docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md. Two other documents still make live claims that these items remain open, surfaced by the doc-8 campaign wave-1 integration review: docs/adr/require-atomic-idempotent-operation-owned-mutations.md line ~69 ("Deliberately not decided here: the file layout, naming scheme, event schema, and locking primitive... Those remain open in the [open component decisions register]...") and docs/specs/quest-cli-architecture.md line ~223 (the "Deferred by design" table row "Naming scheme, event schema | Git mutation contract open items"), immediately below a row that already marks canonical-ID grammar/authored-record-layout closed. Both are live forward-pointing claims, not historical records, so they need updating to reflect the closures.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/adr/require-atomic-idempotent-operation-owned-mutations.md no longer asserts file layout/naming scheme "remain open" in the register
- [ ] #2 docs/specs/quest-cli-architecture.md reflects naming scheme as closed (citing QCLI-25/D4) while leaving event schema open, following the pattern of the row above it
- [ ] #3 No other row/section in either file is modified; no historical-record document (the research programme Spec's own Open Questions list, the QCLI-2.6 threat model's non-goals section) is touched -- those intentionally preserve original wording per this repo's supersession convention
- [ ] #4 lore validate --strict and lore check both pass with 0 errors and 0 warnings
<!-- AC:END -->
