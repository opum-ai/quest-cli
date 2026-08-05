---
id: QCLI-23
title: >-
  Re-verify QCLI-2.7 drift table against lore-cli v0.1.1 and refresh dependent
  documents
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 17:37'
updated_date: '2026-08-05 18:12'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verify live: lore-cli tags (v0.1.0, v0.1.1 only, confirmed via git ls-remote/gh api against authoritative origin, not the local /Volumes/external/repos/lore-cli clone which has uncommitted WIP and a diverged local dev branch from a concurrent process), npm @opum-ai/lore dist-tags (latest=0.1.1), and re-run the 4 adapter-surface-path diffs v0.1.0..v0.1.1 (git diff --stat, all 4 paths, both together and individually) -- expect empty, confirming no Part 2 reclassification.
2. In quest-cli-lore-dependency-and-adapter-contract-evidence.md Part 3: update only the 3 rows the task names as now-false (dev HEAD SHA, ahead/behind count, tag-ancestor answer) against origin/dev (authoritative live ref, not the volatile local clone), dated 2026-08-05 and citing QCLI-23, explaining the ancestor flip (lore-cli PR #300 merged main, containing v0.1.0's commit, back into dev on 2026-08-03). Leave the tag-side facts (v0.1.0 pin, npm/local version at pin time) and the "None" drift rows untouched since independently re-verified still true against the new dev HEAD. Add a dated addendum recording the v0.1.0..v0.1.1 diff result (AC1) and confirm MIN_BACKLOG_VERSION/EXPECTED_SCHEMA_VERSION unchanged, and a note that the reclassification trigger fired and was serviced by this task.
3. In quest-cli-research-source-register.md's "lore-cli / the `lore` command" slice: append a dated 2026-08-05 QCLI-23 re-verification note to the "Exact revision or retrieval date" bullet recording the v0.1.1 tag/npm figures, cross-referencing QCLI-11's activation-gate-evidence-record.md (which first surfaced v0.1.1), and noting the version-bump reclassification trigger did not fire because the documented CLI surface stayed byte-identical.
4. In quest-cli-packaging-contract.md's registry-evidence table: update the @opum-ai/lore row's version cell to 0.1.1 and add a dated "Refreshed 2026-08-05 by QCLI-23" note (matching the existing QCLI-14 correction-note convention immediately below the table) citing QCLI-11's evidence record and the re-checked unchanged fields (license/repository/maintainer/bin).
5. No gate evaluation anywhere -- only evidence recording, matching QCLI-11's boundary discipline.
6. Run `lore validate --strict`, `lore check`, `lore orphans` and confirm clean; fix any managed-block/link issues via lore, not manual edits.
7. Record notes with full command+output evidence for each AC, commit in small logical commits with `Refs: QCLI-23`, push branch.
<!-- SECTION:PLAN:END -->
