---
id: QCLI-29
title: >-
  Correct stale 'nothing accepted' prose in three ratified Quest CLI proposal
  docs
status: To Do
assignee: []
created_date: '2026-08-06 00:29'
updated_date: '2026-08-06 00:29'
labels:
  - campaign
  - 'cluster:proposal-docs'
dependencies: []
references:
  - >-
    docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
  - >-
    docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md
  - docs/reference/quest-cli-scale-target-proposal.md
priority: medium
type: docs
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Phase-1-ratification campaign (QCLI-24..28) produced ADRs for the CLI result contract, canonical identifier grammar, and scale target. The three proposal reference docs that originally raised those questions still carry their pre-ratification 'nothing accepted' framing, now stale and unpointed to the ADR that closed each one. Proposed by QCLI-25's reviewer during wave 1 of the Phase-1-ratification campaign (recorded in backlog/docs/campaigns/doc-4). Follow the repo's existing inline-supersession convention (dated note, citing the directing ADR) rather than rewriting the original proposal prose.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-24), leaving the original proposal prose intact below the note
- [ ] #2 docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-25), leaving the original proposal prose intact below the note
- [ ] #3 docs/reference/quest-cli-scale-target-proposal.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-26), leaving the original proposal prose intact below the note
- [ ] #4 lore validate --strict passes
- [ ] #5 No content changes are made to the three documents beyond the three inline supersession notes
<!-- AC:END -->
