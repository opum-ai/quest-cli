---
id: QCLI-101
title: Flag parser silently swallows mode flags and silently drops duplicated filters
status: To Do
assignee: []
created_date: '2026-08-17 15:24'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - argument-parsing
  - correctness
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: high
type: bug
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two argument-parsing defects in `flags()` / `one()` (`src/cli/main.ts`) that return wrong results with exit 0 rather than failing. Both produce silently incorrect output, which is worse than a crash for scripted or agent use.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## A. A value-taking flag consumes a following mode flag as its value

`flags()` reads `argv[index + 1]` as the value of any non-boolean flag without checking whether that token is itself a flag. A missing value therefore silently binds `--json` or `--plain` as the value:

    $ quest task list --status --json ; echo "exit=$?"
    task.list
    exit=0

The requested JSON mode is silently discarded (output falls back to non-JSON) and the list is filtered by the literal status `--json`. Same for `--plain`. Expected: exit 2, usage - `--status` was given no value.

## B. A duplicated value flag silently disables the filter entirely

`one()` returns `undefined` when a flag was supplied more than once, and callers treat `undefined` as 'no filter'. So repeating a flag does not narrow, widen, or reject the query - it removes it:

    # workspace with T-1 (To Do) and T-2 (In Progress)
    $ quest task list --status "To Do" --json                     -> T-1
    $ quest task list --status "To Do" --status "Done" --json      -> T-1, T-2
    $ quest task list --status "NoSuchStatus" --json               -> (none)

The duplicated form returns T-2, which matches neither requested status. A caller that builds arguments programmatically and accidentally repeats `--status` gets the unfiltered set back and cannot tell. Exit code is 0 throughout.

Boolean flags are handled correctly - `flags()` returns undefined on a repeat, producing a usage error - so the inconsistency is specific to value-taking flags.

Expected: a repeated value flag either accumulates into an OR filter or is rejected as usage; it must never silently drop the constraint.

Affects every value-taking flag reached through `one()`, including `--status`, `--description`, `--id`, `--port`, `--task-id`, `--actor`, `--actor-kind` and `--accountable-human`. The actor flags are the sharpest case: a duplicated `--actor` makes `actor()` return undefined, which surfaces as a `denied` error rather than a usage error, misreporting the cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A value-taking flag whose next token starts with -- is rejected as a usage error (exit 2) rather than binding that token as its value
- [ ] #2 --json and --plain are recognised as output modes wherever they appear in argv and are never consumed as a flag value
- [ ] #3 A repeated value flag either accumulates into a defined multi-value filter or is rejected as usage; it never silently removes the constraint
- [ ] #4 task list --status A --status B returns only tasks matching the requested statuses, never tasks matching neither
- [ ] #5 Tests cover missing-value, repeated-value, and repeated-actor forms for every value-taking flag in the manifest
<!-- AC:END -->
