---
id: QCLI-27
title: >-
  Record the Quest CLI D1 (license, contributor provenance) and D3 (platform
  matrix, ownership) owner rulings
status: In Progress
assignee: []
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 23:05'
labels:
  - campaign
  - decisions
  - phase-1
  - governance
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:governance'
dependencies: []
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entries D1 (product license and contributor provenance) and D3 (supported-platform matrix and final npm package ownership) are the two Phase 1 items the follow-through Story explicitly could not touch: D1 is owner-held and D3 needed a human to claim ownership. The component owner ruled on both in a live session on 2026-08-05, captured in the owning Story. This task records both rulings and adds the resulting LICENSE file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A dated reference document (or ADR, at the implementer's judgment, following this bundle's existing convention for governance-level rulings) records: D1 license = MIT; D1 contributor provenance = informal/none for now; D3 supported-platform matrix = macOS + Linux + Windows; D3 ownership explicitly claimed as quest-cli-owned
- [ ] #2 The same document records D2 (runtime) ownership explicitly claimed as quest-cli-owned, while stating plainly that the runtime choice itself remains deferred to post-activation and is not decided by this task
- [ ] #3 A root LICENSE file exists using the MIT license text, with a copyright line dated 2026 attributed to opum-ai
- [ ] #4 The document names the owning Story as the ruling's provenance, dated 2026-08-05
- [ ] #5 lore validate --strict passes on the new/changed files
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the owning Story (ratify-the-quest-cli-phase-1-component-decisions.md) and the open component decisions register's D1/D2/D3 entries for exact wording to close/claim against.
2. Judgment call: use a Reference doc, not an ADR. The owning Story's own AC text already calls this 'a reference document' (distinct from the three sibling QCLI-24/25/26 tasks, which explicitly author ADRs). This bundle's existing ADRs (docs/adr/) are architectural/technical decisions with Status/Context/Decision/Consequences shape; governance-level rulings that close register entries without an architectural trade-off (license choice, platform support, ownership claims) match the shape of existing docs/reference/ records instead (e.g. quest-cli-open-component-decisions.md, quest-cli-activation-gate-evidence-record.md — dated records citing a Story/task as provenance).
3. Scaffold via 'lore new reference' (not manual file creation), then write body: D1 (license=MIT, provenance=informal/none), D3 (platform=macOS+Linux+Windows, ownership=quest-cli-owned), D2 (ownership only=quest-cli-owned, runtime choice explicitly stays deferred/undecided), citing the owning Story dated 2026-08-05 as provenance, and an explicit 'does not touch' section for D6/D7a/D7b/not-found lore-doc boundary/register-reconciliation (reserved for QCLI-28) to keep scope crisp.
4. Create root LICENSE (plain file, outside lore-managed docs/ tree) with standard MIT text and a 'Copyright (c) 2026 opum-ai' line.
5. Run 'lore validate --strict' and 'lore check'; fix any findings. Re-check each AC against actual file content.
6. Record notes with verification evidence, commit with Refs: QCLI-27 trailer(s), push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Judgment call (AC1): used a Reference doc, not an ADR — docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md. Rationale: the owning Story's own AC text already frames this as 'a reference document' (distinct from QCLI-24/25/26, which explicitly author ADRs); this bundle's existing docs/adr/ entries are Status/Context/Decision/Consequences architectural-tradeoff records, while docs/reference/ already holds dated governance-ruling records with the same shape needed here (quest-cli-open-component-decisions.md, quest-cli-activation-gate-evidence-record.md — both cite a Story/task as provenance and state dated facts without an architectural tradeoff). Scaffolded via 'lore new reference', not manual file creation.

Content covers: D1 license=MIT, contributor provenance=informal/none for now (AC1); D3 platform matrix=macOS+Linux+Windows, ownership explicitly claimed as quest-cli-owned (AC1); D2 ownership explicitly claimed as quest-cli-owned while the runtime choice itself is stated as deferred to post-activation, not decided here (AC2); root LICENSE added with MIT text and 'Copyright (c) 2026 opum-ai' (AC3); document names the owning Story (ratify-the-quest-cli-phase-1-component-decisions.md) as provenance, dated 2026-08-05, in both the intro and the Notes section (AC4). Added a 'What this record does not touch' section listing D6/D7a/D7b/not-found lore-doc boundary/register-reconciliation as explicitly out of scope (reserved for QCLI-28), to keep the scope boundary unambiguous for reviewers.

Verification (AC5): ran 'lore validate --strict' — result: '44 files, 0 errors, 0 warnings, 6 skipped' (includes the new file, exit 0). Also ran 'lore sync' (regenerated docs/log.md, docs/reference/index.md, and the Story's managed task block/status; committed the task's own status-change file under backlog/ per lore's catch-all sweep) and 'lore check --json' — result: '{"findings":[],"errorCount":0,"warningCount":0,"fileCount":44,"complete":true}'.

Out-of-scope discovery (not acted on): 'lore sync' backfilled two missing docs/log.md entries (commits cca60a8, ef15e16) that predate this task and were apparently never logged by whichever commit landed them — harmless, expected reconciliation behavior of 'lore sync', not something this task caused or needed to investigate further. No other out-of-scope issues found.

Fix pass (reviewer request_changes, scope): the branch's earlier 'lore sync' run touched shared managed files (docs/log.md, docs/reference/index.md, and the ratify-Phase-1-decisions Story's managed table) that sibling wave-1 branches QCLI-24 and QCLI-26 also independently touch from their own partial single-task view. Reverted those three files to dev's copies (commit fc83a68) so this branch's diff is scoped to LICENSE, the task file, and the new reference doc docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md only. The claim above that this task ran a full 'lore sync' and committed its index/log/Story-table output as part of this branch no longer holds — that reconciliation is deferred to a single central 'lore sync' pass run once, after all four wave-1 branches (QCLI-24/25/26/27) have merged. Re-ran file-scoped 'lore validate --strict docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md' post-revert: 1 file, 0 errors, 0 warnings, 0 skipped. Did not re-run 'lore check' or 'lore sync' per fix instructions — post-revert drift between the Story's managed table/status and the live task status is expected and intentionally left for the deferred central sync.
<!-- SECTION:NOTES:END -->
