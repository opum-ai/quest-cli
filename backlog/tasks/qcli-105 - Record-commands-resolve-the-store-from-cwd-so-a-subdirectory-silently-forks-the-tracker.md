---
id: QCLI-105
title: >-
  Record commands resolve the store from cwd, so a subdirectory silently forks
  the tracker
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:33'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - workspace
  - correctness
  - data-integrity
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: high
type: bug
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`quest init` resolves the enclosing Git worktree, but every record command resolves its store from `process.cwd()`. Running quest from any subdirectory of an initialized repository therefore reads an empty tracker and, on the first write, creates a second store with colliding ids.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## Repro

    $ git init -q repo && cd repo && git commit -q --allow-empty -m i
    $ quest init --json
    {..."worktreePath":"/private/tmp/repo"}
    $ quest task create "Root task" --actor jdn --actor-kind human --json     # -> T-1

    $ mkdir -p pkg/deep && cd pkg/deep

    # init correctly finds the enclosing worktree:
    $ quest init --json ; echo "exit=$?"
    {"error_type":"validation","message":"Workspace is already initialized.","principal":null}
    exit=6

    # but the record commands do not:
    $ quest task list --json
    {"schemaVersion":1,"kind":"task.list","data":[]}
    $ quest overview --json
    {..."tasks":{"total":0,"byStatus":{}}...}

    # and a write forks the tracker, re-allocating T-1:
    $ quest task create "Nested task" --actor jdn --actor-kind human --json
    {..."kind":"task.created","data":{"id":"T-1","title":"Nested task"...}}

    $ cd ../.. && find . -name .quest -type d
    ./.quest
    ./pkg/deep/.quest

Two stores now exist in one repository, both containing a distinct T-1.

## Cause

`initializeWorkspace` performs Git worktree discovery, but `taskService()`, `taskReader()` and `planningService()` in `src/cli/main.ts` build their repository path from `process.env.QUEST_TASK_STORE ?? process.cwd()` and append `.quest`. There is no upward search for an existing workspace, so the data layer and the bootstrap layer disagree about what 'the workspace' means.

## Impact

- Silent wrong answers rather than errors: `task list`, `overview`, `board`, `doctor` and `search` all report an empty project from a subdirectory, with exit 0.
- Silent data partition: a write from a subdirectory creates a parallel store that no root-level command will ever read.
- Duplicate canonical ids inside one repository, which the id-allocation scheme is specifically meant to prevent.
- Agents and scripts are the most exposed: anything that cd's into a package directory before calling quest forks the tracker with no diagnostic.
- `quest doctor` does not detect the split - it reports the cwd-local store as healthy.

`QUEST_TASK_STORE` remains a valid explicit override; the defect is the implicit cwd default.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Record and planning commands discover the workspace by searching upward for an existing .quest, consistent with how init resolves the Git worktree
- [x] #2 Running any read command from a subdirectory of an initialized workspace returns the same records as running it from the root
- [x] #3 A write from a subdirectory writes to the existing workspace store and never creates a second .quest directory
- [x] #4 QUEST_TASK_STORE continues to override discovery explicitly
- [x] #5 A command run outside any initialized workspace fails with a classified diagnostic rather than silently creating one
- [x] #6 A test creates a task at the repository root, then asserts list, view, overview, board, doctor and search return it from a nested subdirectory
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add initialized-workspace resolution that reuses Git worktree discovery, rejects implicit commands when the worktree has no Quest initialization marker, and preserves QUEST_TASK_STORE as the explicit bypass.
2. Route every task and planning repository in the CLI through the resolved root, including combined project reads and search.
3. Add integration/process regressions for nested list, view, overview, board, doctor, search, nested writes, missing-workspace diagnostics, and explicit overrides.
4. Bump the complete local package candidate from 0.2.0 to 0.2.1, rebuild all platform packages/checksums, and run source plus packed-package gates.
5. Install the verified local 0.2.1 candidate globally and smoke-test the installed executable from a nested directory.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented initialized-worktree resolution for every implicit task and planning repository while retaining QUEST_TASK_STORE as an explicit bypass. Process regressions compare root and nested list/view/overview/board/doctor/search output, prove a nested write allocates T-2 in the root store, prove no nested .quest is created, and exercise classified missing-workspace failures.

Validation: focused workspace/CLI suite 18 passed; full bun test 145 passed; typecheck, targeted Biome lint/format, git diff --check, check:packages, and test:packages passed. The repository-wide layer check still reports five pre-existing adapter/composition-root violations outside QCLI-105; this change added no violating dependency. Exact compiled darwin-arm64 0.2.1 smoke returned root T-1 from a nested directory, allocated nested T-2, and found exactly one .quest.

Built local 0.2.1 root and darwin-arm64 tarballs (SHA-256 a53e73e77673aa5d171f95d1cc86d6188f1d3897a703b1cc25bce0c53ebe9de4 and 6e4481818c4593e3bf4b885c18e73ea980827c741c5791ad6bf2ee89b7b3b8a6). Two approved npm global-install attempts were rejected by the managed filesystem with EPERM before replacement; the active global 0.2.0 installation remains intact.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Resolved every implicit task/planning store through the initialized Git worktree, preventing nested reads from returning empty data and nested writes from creating a second .quest; QUEST_TASK_STORE remains an explicit override and missing workspaces now fail closed. Added root-vs-nested process coverage for list, view, overview, board, doctor, search, writes, overrides, and diagnostics. Bumped the local candidate to 0.2.1, rebuilt all six native packages, passed 145 tests plus package gates, and reproduced the fix against the compiled darwin-arm64 binary. Global npm replacement remains environment-blocked by EPERM; the active 0.2.0 install was not changed.
<!-- SECTION:FINAL_SUMMARY:END -->
