---
id: QCLI-2.1
title: Revalidate Quest research provenance and the migration boundary
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-01 17:23'
labels:
  - campaign
  - research
  - provenance
  - clean-room
  - migration
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies: []
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adopt and revalidate the completed OCLI-3.1 provenance register after the opum-cli to opum-doc identity change. Confirm which source slices remain allowed, contextual, superseded, deferred, excluded, or quarantined before any additional Quest research uses them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The current source register records repository or URL, exact revision or retrieval date, ownership rationale, permitted use, exclusions, and reclassification triggers
- [ ] #2 The former opum-cli repository is identified as opum-doc research provenance, not the Quest implementation home
- [ ] #3 quest-cli remains free of excluded or quarantined source and tests
<!-- AC:END -->
