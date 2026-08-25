---
id: QCLI-97.10
title: Deliver ODOC-63.2 Quest task parity and lossless Backlog migration
status: In Progress
assignee:
  - quest-cli
created_date: '2026-08-21 19:06'
updated_date: '2026-08-21 19:07'
labels:
  - odoc-63.2
dependencies: []
parent_task_id: QCLI-97
priority: high
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Feature parent for the ODOC-63.2 JIT feature-wayfinding campaign: deliver the complete confirmed Quest side of Quest/Lore/Backlog tracker parity — a public schema-1 task projection with full CLI/manifest coverage, create/edit/list/view/search/status-flow semantics, and a lossless multi-pass Backlog task/milestone migration (aliases, configured vocabularies, digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, source immutability). Lore-owned knowledge adoption and archive/delete are out of scope; publication is a later campaign. Grounding: opum-doc dev merge 995b966e8a2bb044c94b5defccbeb06f6cf89c85 (docs/stories/ship-the-lore-and-quest-tracker-parity-release.md, docs/specs/lore-quest-tracker-parity-adoption-and-paired-release-architecture.md, docs/adr/keep-lore-as-documentation-authority-and-quest-as-task-authority.md); canonical adapted capability at opum-doc .treehouse/opum-doc-811ba3/3/opum-doc/tooling/codex-skills/feature-wayfinding/SKILL.md (read-only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A local feature parent exists with sharp child issues created through Backlog CLI and native dependencies wired before execution
- [ ] #2 The public schema-1 task projection and CLI/manifest cover IDs/aliases/lifecycle/status, title/description, labels/assignees, priority/type/ordinal/dates, parent/dependencies/milestone with atomic forward/back references, ordered checked AC/DoD, plan/notes/comments/final summary, references/modified files, and Lore documentation references only
- [ ] #3 Create/edit/list/view/search/status-flow semantics include replace/add/remove/clear, deterministic ordering, case-insensitive configured statuses, actor-required atomic writes, stable versioned JSON diagnostics, and fail-loud compatibility
- [ ] #4 Lossless multi-pass Backlog task/milestone migration preserves aliases and configured vocabularies with digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, and source immutability; no Lore-owned knowledge adoption or archive/delete is implemented here
- [ ] #5 Focused tests, full repository checks, installed-package/packaging validation, strict Lore gates, and exact-tree two-axis review pass before PR to dev
<!-- AC:END -->
