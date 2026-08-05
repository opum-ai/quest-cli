---
id: QCLI-23
title: >-
  Re-verify QCLI-2.7 drift table against lore-cli v0.1.1 and refresh dependent
  documents
status: To Do
assignee: []
created_date: '2026-08-05 17:37'
updated_date: '2026-08-05 17:38'
labels:
  - campaign
  - research
  - lore
  - provenance
  - correction
  - no-implementation
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:provenance'
dependencies: []
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The wave-2 integration review found that lore-cli has cut v0.1.1 and published @opum-ai/lore@0.1.1 since QCLI-2.7 was last verified, which QCLI-2.7 own text names as an explicit reclassification trigger: cutting a new tag must trigger re-verification of MIN_BACKLOG_VERSION and EXPECTED_SCHEMA_VERSION and the drift table, not silent reuse of the old numbers. No task has serviced that trigger. The good news, already independently confirmed by the integration review: the four adapter-surface paths (cli-surface.md, cli-contract.md, okf-projection-contract.md, src/adapters/backlog.ts) are byte-identical between v0.1.0 and v0.1.1, and MIN_BACKLOG_VERSION and EXPECTED_SCHEMA_VERSION are unchanged, so no Part 2 reclassification follows from this task. Three Part 3 drift-table rows are nonetheless now factually false rather than merely dated: the recorded dev HEAD SHA, the commit-count comparison between the tag side and devs side, and the tag-is-an-ancestor-of-dev-HEAD answer, which has flipped. The research source register and the packaging contract both still cite the old v0.1.0 pin with no cross-reference to the newer capsule QCLI-11 already recorded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Re-verify lore-cli current release state live (tag, npm version) and re-run the four adapter-surface-path diffs QCLI-2.7 names, recording that no Part 2 reclassification follows if they remain byte-identical
- [ ] #2 The Part 3 drift table in the lore dependency and adapter contract evidence document is corrected to the current dev HEAD SHA, the current commit-count comparison, and the current tag-ancestor-of-dev-HEAD answer, all dated and citing this task
- [ ] #3 The research source register row citing the lore-cli release evidence is refreshed to the current retrieval date and version, cross-referencing QCLI-11 own evidence record rather than leaving the two capsules silently inconsistent
- [ ] #4 The packaging contract row citing @opum-ai/lore is refreshed the same way
- [ ] #5 No gate evaluation is performed or implied by this task -- it records evidence only, preserving the boundary discipline QCLI-11 established
- [ ] #6 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->
