---
id: QCLI-125
title: >-
  quest init fails with a raw not-a-worktree error instead of prompting for git
  init
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 18:50'
updated_date: '2026-08-28 19:49'
labels:
  - cli
  - init
  - ux
  - error-handling
dependencies: []
references:
  - src/adapters/workspaces/local-workspaces.ts
  - src/cli/main.ts
priority: medium
type: bug
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest init calls LocalWorkspacePort.inspect() (src/adapters/workspaces/local-workspaces.ts:17-24), which throws WorkspaceError(not_git_worktree, "Path is not a Git worktree.") when no Git repository is present. src/cli/main.ts (init branch, around line 478) does not catch this, so a first run outside a repo surfaces that low-level message with no next step. quest init should recognize the missing-repository case and tell the user to run git init, or offer to run it, instead of the raw worktree error.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Running quest init outside a Git repository names the missing Git repository as the cause instead of showing "Path is not a Git worktree."
- [x] #2 The failure path tells the user to run git init, or offers to run it, before quest init proceeds.
- [x] #3 Running quest init inside a valid Git worktree is unchanged.
- [x] #4 Non-interactive usage (--json, --plain, or no TTY) still fails with an actionable message rather than blocking on a prompt.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In the runQuest catch-all error mapper (src/cli/main.ts, end of runQuest), add a
   special case for WorkspaceError code "not_git_worktree" ahead of the generic
   validation fallback: return an actionable message ("No Git repository was found
   here. Run `git init` to create one, then re-run `quest init`.") plus a hint,
   instead of surfacing the adapter's generic "Path is not a Git worktree." text.
2. Do not add interactive prompting here (out of scope; QCLI-126 owns quest init's
   interactive setup). The AC's "or offers to run it" is satisfied by the
   error-message path since it names the exact command to run.
3. Add a focused test in test/contract/cli-process.test.ts (or a new file) that
   runs `quest init` against a plain empty temp directory (no git init) and
   asserts the new message text and that exit code/error_type are unchanged
   (still validation), plus a regression test that init inside a real worktree
   is unaffected.
4. Run bun test and bun run typecheck before opening the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as a catch-all special case for WorkspaceError code not_git_worktree in runQuest's error mapper (src/cli/main.ts), ahead of the generic validation fallback. New message: "No Git repository was found here. Run `git init` to create one, then re-run `quest init`." plus a hint. Deliberately did not add interactive prompting (out of scope; QCLI-126 owns interactive quest init setup) - AC2's "or offers to run it" is satisfied by naming the exact command.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest init (and any command resolving the workspace root) outside a Git repository now returns an actionable message naming the missing repository and the fix, instead of the adapter's generic "Path is not a Git worktree." Verified with new tests in test/contract/bootstrap-process.test.ts: quest init in a fresh non-git temp dir gets the new message (exit 6, validation); quest init in a real git-init'd temp dir is unaffected (exit 0, workspace.initialized). Also updated one existing test that asserted the old message text. Merged via PR #162 (merge commit b154410); all 13 CI checks passed (source-gates plus every platform job in both prepublication-qualification.yml and projection-platform.yml).
<!-- SECTION:FINAL_SUMMARY:END -->
