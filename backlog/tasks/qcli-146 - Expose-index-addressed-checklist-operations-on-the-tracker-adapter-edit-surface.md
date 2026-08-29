---
id: QCLI-146
title: >-
  Expose index-addressed checklist operations on the tracker adapter edit
  surface
status: To Do
assignee: []
created_date: '2026-08-29 05:55'
labels:
  - parity
  - tracker-contract
dependencies: []
priority: medium
type: feature
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-138 added index-addressed acceptance-criteria and definition-of-done operations to 'task edit' and 'task edit-batch', both of which reach them through the shared foldEditPatch. The tracker subprocess contract is the third transport over that same fold and was left behind.

TrackerEditPatch (src/contract/tracker/index.ts) and the editArguments builder that turns it into argv carry no index operations, so a Lore-side tracker adapter can only replace a checklist wholesale. That is the exact read-modify-write hazard QCLI-138 removed from the CLI, still reachable through the adapter.

QCLI-138 did update the contract's required manifest field list, so probe() now passes; this is only about the edit patch type and its argv projection.

Found by independent review of QCLI-138 on 2026-08-29. Not required by any QCLI-138 acceptance criterion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 TrackerEditPatch carries the eight index-addressed checklist operations that EditPatchVocabulary does.
- [ ] #2 editArguments projects each of them to the matching quest task edit flag, with 1-based positions.
- [ ] #3 A conformance test drives every new operation through QuestTrackerClient.edit against the real runQuest and asserts the resulting task state.
<!-- AC:END -->
