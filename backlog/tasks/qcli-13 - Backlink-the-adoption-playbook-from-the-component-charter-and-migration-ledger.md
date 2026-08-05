---
id: QCLI-13
title: Backlink the adoption playbook from the component charter and migration ledger
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:51'
labels:
  - campaign
  - 'cluster:adoption'
  - migration
  - navigation
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the playbook (docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md) to confirm its existing outbound citations to the charter (line 75) and the migration ledger (lines 427-428) and leave both untouched (AC3).
2. Component charter (docs/reference/quest-cli-component-charter.md): in the 'Owns here' list, link the existing 'migration, coexistence, aliases, and reversible fidelity reports' bullet to the playbook - this is the exact bullet the playbook's own intro cites as its charter grounding, so this closes that specific loop rather than adding a generic 'see also'.
3. Migration ledger (docs/reference/former-ocli-to-qcli-migration-ledger.md): add a sentence to the 'Source provenance boundary' section noting the playbook cites this ledger as read-only background (mirroring the playbook's own Sources table row for the ledger), with a link. Does not touch the OCLI/QCLI mapping table.
4. Read (do not edit) docs/reference/quest-cli-research-source-register.md to check whether it pins either edited file, per the known trap. Per explicit dispatch instruction for this parallel wave, do NOT edit the register even if a pin is found - record findings in --append-notes instead so a follow-up task can act. QCLI-15 is concurrently editing that file in this same wave; touching it would risk a merge collision.
5. Run lore validate --strict, lore check, and lore orphans and capture exact output.
6. Record notes and evidence via --append-notes; commit docs/ changes with a Refs: QCLI-13 trailer; push the branch.
<!-- SECTION:PLAN:END -->
