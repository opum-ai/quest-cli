---
id: QCLI-25
title: >-
  Author an ADR for the Quest CLI canonical identifier grammar and
  authored-record layout
status: To Do
assignee: []
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:38'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - identity
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:identity'
dependencies: []
documentation:
  - >-
    docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-19 proposed the canonical identifier grammar and authored-record layout for register entry D4 but explicitly decided nothing. The component owner ruled on it in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so register entry D4 can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An accepted ADR records D4 as closed: the canonical-id grammar shape accepted as QCLI-19 proposed (fixed literal prefix, flat unpadded decimal sequence, single global counter, ASCII-only alphabet, one fixed canonical case)
- [ ] #2 The ADR fixes the literal prefix as T
- [ ] #3 The ADR records the authored-record layout accepted as proposed: one Git-tracked file per canonical task, filename anchored on the canonical id with an optional non-identity-bearing slug, identity-free subdirectories, and alias data co-located on the canonical record rather than a separate index
- [ ] #4 The ADR records the Unicode-normalisation-plus-case-folding rules accepted as proposed: ASCII-only fold to one fixed case for canonical ids, NFC-plus-default-case-fold for aliases
- [ ] #5 The ADR names QCLI-19's proposal and the owning Story as the ruling's provenance, and lists what QCLI-19 left deliberately open (D5, D7a, lease/heartbeat timing, the counter's persisted shape, whether a migrated source identifier auto-registers as an alias) as still open and not settled by this ADR
- [ ] #6 lore validate --strict passes on the new ADR file
<!-- AC:END -->
