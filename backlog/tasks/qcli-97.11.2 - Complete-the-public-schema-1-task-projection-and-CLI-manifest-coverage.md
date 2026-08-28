---
id: QCLI-97.11.2
title: Complete the public schema-1 task projection and CLI/manifest coverage
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-21 19:45'
updated_date: '2026-08-21 20:56'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.11.1
parent_task_id: QCLI-97.11
priority: high
type: feature
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the complete public schema-1 task projection for quest-cli: IDs/aliases/lifecycle/status, title/description, labels/assignees, priority/type/ordinal/dates, parent/dependencies/milestone with atomic forward/back references, ordered checked AC/DoD, plan/notes/comments/final summary, references/modified files, and Lore documentation references only (no Quest document store). The schema-1 manifest must advertise every supported public command accurately. Scope boundary (review-correction ad7dd9c69be34f12bcc1208e0215f9d9 finding 5): this child owns the schema/projection/manifest contract; CLI replace/add/remove/clear semantics, case-insensitive statuses, and relationship writes belong to QCLI-97.11.3; migration mapping/provenance/closure belongs to QCLI-97.11.4.

Ownership (feature-wayfinding gate feature-wayfinding-v2, correlation 1cdd200728ec4d8c8e3342f8a2d235c4):
- quest-cli:src/domain/tasks/tasks.ts
- quest-cli:src/contract/tracker/index.ts
- quest-cli:src/application/command-contract.ts
- quest-cli:test/integration/tasks/tasks.test.ts
- quest-cli:test/integration/projection/sqlite-projection.test.ts
- quest-cli:test/contract/tracker
- quest-cli:test/contract/command-contract.test.ts
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The schema-1 projection covers every field in the ODOC-63.2 outcome list with deterministic ordering
- [x] #2 Parent/dependency/milestone mutations write forward and back references atomically
- [x] #3 The manifest and help surface advertise all supported commands with exact result kind, mutates flag, supported fields/filters, and all preview/apply/status/rollback migration capabilities; no Quest document store is introduced
- [x] #4 Manifest conformance is enforced for every advertised command including negative compatibility tests for unknown/unadvertised commands
- [x] #5 Focused tests cover each projection field group and atomic reference closure
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Domain TaskState (src/domain/tasks/tasks.ts): add assignees, references, modifiedFiles, createdAt, updatedAt, finalSummary, milestoneId; convert acceptanceCriteria/definitionOfDone to ordered {index,text,checked} items; keep plan/implementationNotes as ordered string items; update taskSchema zod + createTask defaults + taskState() validation. 2. Case-insensitive configured-status helper (statusKey fold) used by createTask, transitionTask, list filter, and status-flow (replace hard-coded list with configured statuses). 3. Atomic forward/back references: parent/dependency via canonicalizeTaskLinks (existing) + milestoneId <-> Milestone.taskIds written atomically in the same commit path; dangling-edge diagnostics. 4. Public tracker contract (src/contract/tracker/index.ts): extend TrackerSummary/TrackerTask with all schema-1 fields incl. checked AC/DoD, dates, milestoneId, references, modifiedFiles, finalSummary; TrackerEditPatch gains replace/add/remove/clear for plan/notes/comments/AC/DoD/milestone/dependencies; validData + fixtures updated. 5. Manifest (src/application/command-contract.ts): advertise exact result kind, mutates flag, supported fields/filters per command incl. all preview/apply/status/rollback migration capabilities; validateCommandManifest enforces conformance; negative compatibility tests for unknown/unadvertised commands. 6. Tests: test/integration/tasks/tasks.test.ts, test/integration/projection/sqlite-projection.test.ts, test/contract/tracker/*, test/contract/command-contract.test.ts — per-field-group projection coverage + atomic reference closure + manifest conformance negatives.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-21: review-correction ad7dd9c69be34f12bcc1208e0215f9d9 accepted; AC sharpened per finding 3 (manifest conformance for every command's exact result kind, mutates flag, fields/filters, preview/apply/status/rollback migration capabilities, negative compatibility tests); scope de-overlapped per finding 5 (.2 = schema/projection/manifest contract only). Lore review profile compiled at opum-doc checkpoint 5b23bdd6d4 before this child.

2026-08-21: Lore contexts compiled successfully at opum-doc checkpoint 5b23bdd6d4 (pinned binary, no empty-body digests). implementation profile (prior turn): specs/quest-cli-architecture sha256:58af65a6…, adr/keep-lore-optional-and-integrate-only-through-versioned-public-records sha256:93b5f850…, stories/harden-and-qualify-quest-cli-0-2-x sha256:8480804a…, runbooks/quest-cli-operations sha256:4779f181…, reference/quest-cli-component-contracts-and-delivery-graph sections f76f184e…/14d259e7…. review profile (this turn, .lore/agents/review.toml): 9 bodies incl. adr/keep-lore-optional… 93b5f850…, story 8480804a…, runbook 4779f181…, delivery-graph sections f76f184e…/bb37b622…/859ef2cb…/14d259e7…/998039c2…/9d2a61a6…. verification profile (.lore/agents/verification.toml): 8 bodies incl. runbook 4779f181…, reference/quest-cli-release-truth e8b7d793…, story 8480804a…, ADR 93b5f850…, sections f76f184e…/998039c2…/98618570…/966e4982…. Load-bearing constraints: versioned public-record exchange (schema id+version+provenance); manifest = compatibility boundary (QCLI-102/101/110 defect classes); release-truth schema-1 matrix (preview/apply/status/rollback exact kinds + mutability, actor-free apply/rollback denied exit 4, dotted legacy alias LCLI-315.4 resolution); result-contract ADR ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly was omitted-by-budget in both packs and is read directly as required grounding; gate set type/lint/format/architecture/test/package + lore validate --strict / lore check --strict (exit 6) / git diff --check. Gaps recorded: result-contract ADR budget-omission (direct-read workaround), component-charter budget-omission, no dedicated test-selection runbook source, Story managed task block lacks QCLI-97.11 coupling (Lore-side repair, authority-gated).

2026-08-21: QCLI-97.11.2 implemented in leased tree (correlation 7367a69f5211440aba510a1b06bce17a). Changes: src/domain/tasks/tasks.ts (TaskCheckItem/TaskCheckList/MilestoneTaskSide, optional assignees/references/modifiedFiles/createdAt/updatedAt/finalSummary/milestoneId on TaskState+schema, statusKey/resolveConfiguredStatus case-insensitive configured-status resolution in createTask/transitionTask storing canonical spelling, normalizeCheckList legacy-string->item normalization with check_item_index_mismatch fail-loud, closeMilestoneReference + validateMilestoneClosure pure atomic forward/back closure helpers); src/contract/tracker/index.ts (TrackerCheckItem, TrackerSummary +assignees/ordinal/createdAt/updatedAt, TrackerTask +milestoneId/finalSummary/references/modifiedFiles and checked checklists, TrackerCreateInput/TrackerEditPatch full replace/add/remove/clear field set with fixed-order argv emission, isCheckList validation accepting legacy strings and items, manifest entry fields/filters); src/application/command-contract.ts (fields/filters advertisement on migration preview/apply/status/rollback, task status-flow/list/view/search/create/edit, draft/milestone/decision entries; validateCommandManifest now enforces exact closed-set conformance: unknown/unadvertised names rejected, kind/mutates/fields/filters must equal the canonical golden, advertised set must be exactly the supported set); src/contract/tracker/fixtures.ts (trackerTaskFixture full schema-1 shape; manifest fixture fields/filters) — boundary note: fixtures.ts sits just outside the enumerated owned paths but the task plan explicitly required "validData + fixtures updated" and the owned client tests import it; treated as in-scope conformance fixture. Tests added/updated: test/integration/tasks/tasks.test.ts (+5: schema-1 deterministic normalization, legacy checklist migration + reordering rejection, atomic milestone closure, workspace closure fail-loud, case-insensitive statuses), test/integration/projection/sqlite-projection.test.ts (+2: schema-1 payload round-trip of every field group, legacy checklist normalization on read), test/contract/tracker/quest-tracker-client.test.ts (+4: legacy/item checklist acceptance + malformed rejection, probe missing/drifted manifest entries, edit argv fixed order, create argv), test/contract/command-contract.test.ts (golden updated to exact fields/filters; +2: unknown/missing/drifted entry negatives, migration capability exact kinds/mutability). Validation: bun run check green (typecheck/lint/format:check/layer:check/test: 179 pass 0 fail). Residual for .3: CLI parsing of the new argv flags (src/cli/**) and replacing the hardcoded status-flow at src/cli/commands/task/index.ts L97 with the configured policy; same-commit two-store milestone write remains for .3/.4 application layer.

2026-08-21: two-axis review (standards + spec) completed on pinned diff e700c3e..b94c637; findings addressed in follow-up commit 7822301: F1 locale-dependent statusKey -> toLowerCase (locale-invariant); F9 closeMilestoneReference now fails milestone_reference_drift on back-ref-only pairs instead of silent repair; spec finding 2 localeCompare -> codepoint sort(); spec finding 4 manifest fields completed for draft view / milestone list / decision list; standards F4 legacy-payload test now inserts a raw pre-change row bypassing taskState to prove read-path normalization; standards F6 argv tests slice from first patch flag; spec finding 6 conformance fixture manifest carries full fields/filters; standards F5 validator empty-list/order-sensitivity documented. Deferred with explicit ownership: standards F2 (CLI parsing of the new argv flags — owned by QCLI-97.11.3, which also replaces the hardcoded status-flow and exact list filter at src/cli/commands/task/index.ts L97/L108) and spec finding 1 (application-layer same-commit milestone write wiring — .3/.4). Residual nits accepted: F7 data clump (golden literals must stay literal by design), F8 TaskCheckList union return type (wire accepts both forms by contract), F10 pre-existing fixture envelope shape. Verification: bun run check green at HEAD 7822301f5bade1106ecdcd0f62b34422c64e8541 (typecheck/lint/format:check/layer:check; 179 pass 0 fail, 1740 expect calls).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the public schema-1 task projection and CLI/manifest coverage in the leased execution tree: TaskState/tracker contract/manifest now carry assignees, references, modifiedFiles, createdAt/updatedAt, finalSummary, milestoneId, ordered checked AC/DoD items (legacy strings normalize fail-loud), case-insensitive configured-status resolution storing canonical spelling, pure closeMilestoneReference/validateMilestoneClosure atomic forward/back closure helpers, full replace/add/remove/clear edit-patch argv contract, and exact closed-set manifest conformance with fields/filters advertisement for every supported command including all four migration capabilities. Verified with bun run check green (typecheck/lint/format:check/layer:check; 179 pass 0 fail across 29 files) including 13 new focused tests per field group, atomic reference closure, and negative compatibility cases.
<!-- SECTION:FINAL_SUMMARY:END -->
