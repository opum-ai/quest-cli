---
id: QCLI-2.1
title: Revalidate Quest research provenance and the migration boundary
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 06:31'
labels:
  - campaign
  - research
  - provenance
  - clean-room
  - migration
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:provenance'
  - wave-1
dependencies:
  - QCLI-1
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the completed OCLI-3.1 register (opum-doc docs/reference/dated-opum-fleet-and-prior-art-inventory.md, recoverable in full at commits 7b82afc/d42c016) and the quest-cli migration ledger's source-provenance boundary as the baseline to revalidate, not copy verbatim.
2. Re-verify each dated claim live rather than trusting prior text: confirm the opum-cli->opum-doc rename via `git remote -v` in the local opum-doc checkout; confirm the two recovery commits are reachable; confirm quest-doc's canonical provenance ledger and clean-room spec do not conflict with what quest-cli records.
3. Verify the owner's 2026-08-04 backlog.md ruling against the locally installed tool: `backlog --version` (1.49.3), `npm view backlog.md version/license/repository` (MIT, MrLesk/Backlog.md) - record public-surface allowed, implementation/tests excluded, with the authorship-independence rationale, not a licensing one.
4. Verify the dated Lore/npm evidence supplied by the orchestrator instead of copying it: check `lore --version`, resolve the local `lore` binary's real npm package and GitHub origin, and run `npm view` against `quest`, `quest-cli`, `lore`, `lore-cli`, and the `@salient-data/*`/`@opum-ai/*` scopes plus `gh release view`/`gh repo view` for the lore-cli release tag.
5. Author a new lore-managed Reference doc under docs/reference/ (scaffolded via `lore new reference`) recording, per source slice: repository/URL, exact revision or retrieval date, ownership rationale, permitted use, exclusions, and reclassification triggers, using the allowed/contextual/superseded/deferred/excluded/quarantined vocabulary from the research Spec. Explicitly state the opum-cli->opum-doc identity (AC2) and confirm quest-cli's current file inventory holds no excluded/quarantined material (AC3).
6. Link the new Reference into docs/reference/index.md and docs/index.md navigation (via `lore sync`/manual cross-link, letting lore manage the generated index block) and note any Quest-wide-impacting finding as a proposal to quest-doc rather than normative here.
7. Run `lore sync` then `lore check` (and `lore validate --strict` if needed) and capture real output; fix only drift lore itself reports.
8. Record decisions and verification output via `backlog task edit QCLI-2.1 --append-notes`; flag anything needing owner attention via `--comment`.
9. Commit in small logical slices with `Refs: QCLI-2.1` trailers, confirm nothing lore/backlog left unstaged, and push the branch.
<!-- SECTION:PLAN:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: QCLI-1 is now an explicit dependency, matching the canonical research specification. Dated OCLI source classifications remain provisional until this task revalidates them.
---
<!-- COMMENTS:END -->
