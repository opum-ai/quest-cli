---
id: QCLI-13
title: Backlink the adoption playbook from the component charter and migration ledger
status: In Progress
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:48'
labels:
  - campaign
  - 'cluster:adoption'
  - migration
  - navigation
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.10 recorded that the component charter and migration ledger were not backlinked from its new playbook or vice versa, because that task was explicitly instructed not to edit either file even to add a backlink. It was never filed.

Verified on 2026-08-05: the playbook DOES cite both (lines 75 and 427-428), so only one direction is missing - neither the charter nor the migration ledger links to the playbook. Scope is therefore narrower than the original note implies: add the missing inbound links, do not re-add outbound ones that already exist.

Known trap: both target files may be pinned by the research source register. Check before merging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The component charter links to the adoption and migration playbook from a contextually appropriate place
- [ ] #2 The migration ledger links to the adoption and migration playbook from a contextually appropriate place
- [ ] #3 The playbook's existing outbound citations are left unchanged, since they already exist
- [ ] #4 If the research source register pins either edited document, the pin is handled in the same pass or the need for a separate correction is recorded
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
