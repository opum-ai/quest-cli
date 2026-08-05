---
id: QCLI-26
title: Author an ADR for the Quest CLI scale target and rebuild-on-doubt conclusion
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:56'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - projection
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:projection'
dependencies: []
documentation:
  - docs/reference/quest-cli-scale-target-proposal.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
  - >-
    docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md
type: docs
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-20 proposed a scale target for register entry D5 and a rebuild-on-doubt conclusion for the projection port's transactional-semantics question, but explicitly decided nothing and chose no storage or index engine. The component owner ruled on it in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so register entry D5 can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An accepted ADR records D5 as closed, accepting QCLI-20's proposed design points as-is: ~10,000 active-plus-historical task records per enrolled workspace, ~100,000-150,000 events per enrolled workspace, ~25 concurrently enrolled workspaces per installation, ~5-10 live clones per enrolled repository, and a rebuild time budget of low single-digit seconds at ordinary per-workspace scale and low minutes at the ~25-workspace aggregate bound
- [ ] #2 The ADR accepts the rebuild-on-doubt-remains-sufficient conclusion: full ACID-style cross-record transactional semantics are not implied by this scale target
- [ ] #3 The ADR states explicitly that it chooses no storage or index engine, consistent with register entry D2 remaining blocked post-activation and the research programme Spec's prohibition on freezing runtime-dependent choices before Phase 0
- [ ] #4 The ADR names QCLI-20's proposal and the owning Story as the ruling's provenance
- [ ] #5 lore validate --strict passes on the new ADR file
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a new ADR via `lore new adr "Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient"` (tags: quest, cli, scale, projection, decisions; summary stating D5 closure).
2. Author Status/Context/Decision/Consequences prose (outside any managed block) that: (a) states Accepted and names QCLI-20's proposal doc and the ratify-Phase-1-decisions Story as provenance for the owner's live-session ruling on 2026-08-05 — distinct from the existing 8 ADRs, which promote already-settled research, this one ratifies a fresh owner ruling; (b) restates QCLI-20's five design points verbatim (record count, event count, workspace count, clone count, rebuild time budget at both scales) as accepted; (c) accepts the rebuild-on-doubt-remains-sufficient conclusion and states full ACID cross-record transactional semantics are not implied; (d) explicitly states no storage or index engine is chosen, tied to D2 staying blocked post-activation and the research programme Spec's pre-Phase-0 freeze prohibition; (e) Consequences section notes D5 can now be closed (by QCLI-28, not this task), and restates QCLI-20's own scale-dependence caveat so a future higher scale ruling isn't foreclosed.
3. Do not edit the open component decisions register, contracts graph, delivery roadmap, or any D6/D7a/D7b/not-found-convention content — QCLI-28's job.
4. Run `lore sync` to regenerate docs/adr/index.md and docs/log.md, then `lore check` and `lore validate --strict` against the new file; fix any finding.
5. Cross-check each AC against the literal file text.
6. Record verification evidence in --append-notes, attach the new ADR path to the task's --doc list alongside the existing two, commit (small logical commits, Refs: QCLI-26 trailer), and push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md via `lore new adr`, then authored Status/Context/Decision/Consequences prose by hand (outside any managed block).

Interpretation calls made (ACs are the durable record; no further source consulted):
- 'D5 as closed' is read as: this ADR accepts the design points and states D5 is closed by its existence; the mechanical edit to the open component decisions register's own table row is explicitly QCLI-28's job per the campaign Story and this task's own scope boundary, so I did not touch that register.
- This is the first of the four Phase-1 ratification ADRs to record a *fresh* owner ruling rather than promote an already-settled research-campaign decision (all 8 pre-existing ADRs are the latter). I said so explicitly in the Status section so a reader isn't misled by the sameness of the template.
- Chose title/tags/summary myself (not specified by the AC text): title 'Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient'; tags quest, cli, scale, projection, decisions; summary trimmed to satisfy lore's ~200-char guidance.
- Design-point figures and the transactional-semantics sentence are restated verbatim from the AC text / QCLI-20's proposal, not paraphrased, to avoid any drift in the accepted numbers.
- Named D2/D6/D7a/D7b/not-found-lore-doc-boundary and the register/contracts-graph/roadmap edits as explicitly out of scope in the ADR's own 'Deliberately not decided here' clause, consistent with this task's scope boundary.

Verification:
- Re-read the finished file against all 5 ACs line by line: AC1 (design-point table, verbatim wording) ok; AC2 (rebuild-on-doubt sentence, verbatim) ok; AC3 (no-engine statement tied to D2-blocked + research-programme pre-Phase-0 freeze prohibition) ok; AC4 (Status section links QCLI-20's proposal doc and the ratify-Phase-1 Story) ok; AC5 below.
- `lore validate --strict docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md --plain` -> 'ok docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md' / '1 file, 0 errors, 0 warnings, 0 skipped', exit 0.
- `lore validate --strict --plain` (whole bundle) -> '44 files, 0 errors, 0 warnings', exit 0.
- `lore check --plain` -> '44 files, 0 errors, 0 warnings', exit 0.
- `lore orphans --plain` -> '0 orphan tasks, 0 dangling links', exit 0.
- `lore sync --plain` was run before the checks above; it regenerated docs/adr/index.md (new ADR entry), docs/log.md (catching up two pre-existing commits that predated this worktree and had never been logged, plus this task's own commits), and docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md's managed task table/status (QCLI-26 now shows In Progress, Story status in-progress) — this is expected lore-managed reconciliation, not a manual edit, and touches only the Story this task already documents against, not the register/contracts-graph/roadmap.

Out-of-scope observation for the orchestrator: none found beyond the expected lore-managed reconciliation above. The open component decisions register, contracts graph, and delivery roadmap were read-only for this task and are untouched, per scope; QCLI-28 still needs to fold in D5's closure once all four Phase-1 ADRs land.
<!-- SECTION:NOTES:END -->
