---
id: QCLI-36
title: 'Fix QCLI-34''s task metadata: correct the references field to real paths'
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 16:54'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:task-metadata'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34's own `references` field names two paths that don't exist: `docs/registers/quest-cli-open-component-decisions.md` (the docs/registers/ directory doesn't exist at all) and `docs/specs/quest-cli-component-contracts-and-delivery-graph.md` (that file actually lives under docs/reference/, not docs/specs/). QCLI-34's own reviewer confirmed via git diff --name-only that the worker correctly edited the real files at docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md — the shipped documentation change was correct, only the task record's own metadata is wrong. Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QCLI-34's references field lists exactly docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md
- [x] #2 No other field on QCLI-34 (status, labels, notes, final summary, acceptance criteria) is modified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify current (wrong) references field on QCLI-34 via backlog task view --json.
2. Confirm the two claimed-correct paths exist in git (git ls-files) and the two claimed-wrong paths do not (docs/registers/ dir absent; docs/specs/... file absent under that path but present under docs/reference/).
3. backlog task edit --help confirms the CLI flag is '--ref <reference>' (repeatable, sets/replaces the full references list), not '--references'.
4. Run: backlog task edit QCLI-34 --ref "docs/reference/quest-cli-open-component-decisions.md" --ref "docs/reference/quest-cli-component-contracts-and-delivery-graph.md"
5. Verify via backlog task view QCLI-34 --json that references is exactly the two correct paths and no other field (status, labels, notes, final summary, acceptance criteria, plan) changed vs the pre-edit JSON snapshot.
6. Record before/after evidence in QCLI-36 --append-notes.
7. Commit the QCLI-34 task-file change on this branch with a 'Refs: QCLI-36' trailer; push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTED. Confirmed via git ls-files: docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md both exist and are tracked; docs/registers/ has 0 tracked files (dir doesn't exist); docs/specs/quest-cli-component-contracts-and-delivery-graph.md does not exist at that path.

CLI note: help text names the flag '--ref <reference>' (repeatable; 'set references'), not '--references' as the task text speculated. Used: backlog task edit QCLI-34 --ref "docs/reference/quest-cli-open-component-decisions.md" --ref "docs/reference/quest-cli-component-contracts-and-delivery-graph.md"

BEFORE (QCLI-34 references): ["docs/registers/quest-cli-open-component-decisions.md", "docs/specs/quest-cli-component-contracts-and-delivery-graph.md"]
AFTER (QCLI-34 references): ["docs/reference/quest-cli-open-component-decisions.md", "docs/reference/quest-cli-component-contracts-and-delivery-graph.md"]

Diffed full --json output before vs after: the only two fields that changed are 'updatedAt' (auto-managed timestamp) and 'references'. status, priority, type, assignees, labels, description, acceptanceCriteria, implementationPlan, implementationNotes, finalSummary are byte-identical. git diff on the QCLI-34 task file confirms the same: only updated_date and the two references lines changed in the frontmatter, nothing else in the file body.

Verified: backlog task view QCLI-34 --json shows references field is exactly [docs/reference/quest-cli-open-component-decisions.md, docs/reference/quest-cli-component-contracts-and-delivery-graph.md]; both files confirmed git-tracked, old paths confirmed absent; diff confirmed no other field on QCLI-34 changed. Reviewer independently re-verified both criteria. Merged as cc8787e (PR #52).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed QCLI-34's own references field, which named two nonexistent paths (docs/registers/... and docs/specs/...), to the two real, git-tracked docs/reference/ files the QCLI-34 worker actually edited. Metadata-only fix via backlog task edit --ref; no documentation content changed. Reviewer independently confirmed both acceptance criteria and that no other field on QCLI-34 was touched.
<!-- SECTION:FINAL_SUMMARY:END -->
