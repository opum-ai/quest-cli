---
id: QCLI-101
title: Flag parser silently swallows mode flags and silently drops duplicated filters
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:24'
updated_date: '2026-08-17 20:20'
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
- [x] #1 A value-taking flag whose next token starts with -- is rejected as a usage error (exit 2) rather than binding that token as its value
- [x] #2 --json and --plain are recognised as output modes wherever they appear in argv and are never consumed as a flag value
- [x] #3 A repeated value flag either accumulates into a defined multi-value filter or is rejected as usage; it never silently removes the constraint
- [x] #4 task list --status A --status B returns only tasks matching the requested statuses, never tasks matching neither
- [x] #5 Tests cover missing-value, repeated-value, and repeated-actor forms for every value-taking flag in the manifest
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Make flag parsing preserve output modes, reject flag-shaped missing values, and surface precise usage diagnostics for duplicate boolean and single-value flags.
2. Keep established collection flags accumulating, but reject repeated task-list --status and every other single-value flag before command execution.
3. Add source-level coverage across the value-flag matrix plus compiled-binary black-box regressions for missing and duplicate status flags.
4. Bump the local candidate from 0.2.1 to 0.2.2, rebuild all six Bun platform packages, refresh checksums, and qualify repository/package gates.
5. Stage and attempt the global reinstall; if managed npm EPERM blocks replacement, preserve exact candidate evidence and provide the owner-run install action, then sync Lore and finalize QCLI-101.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Repeated-flag decision: reject repeated --status as usage. The retained public qualification row explicitly requires the duplicate-status case to produce a classified nonzero failure, so OR accumulation would not meet the requested two FAIL-to-PASS flips. Existing true collection flags (--label, --doc, --task, --add-label, --remove-label) remain repeatable and accumulate; every flag consumed through one(), including --id, --port, --task-id, actor identity fields, description, title, context, outcome, and --status, rejects repeats before command execution. This preserves established task-create label behavior while eliminating every silent-drop path.
Inherited-state reconciliation: live dev is 0c90eb2 (the QCLI-105 merge and handover commits are already present), while the repository candidate remains 0.2.1. The global quest points to /private/tmp/quest-v0.2.2: its launcher matches the repository launcher (4c4a8013...) but its native binary f89ad3fa... does not match the repository candidate 974d1504..., so PATH is not trusted until the final reinstall. Existing unrelated bin/quest.cjs mode-only change and untracked QCLI-97.8 are preserved.

Implemented a parser-level usage diagnostic that pre-recognizes --json/--plain, rejects any value token starting with --, rejects duplicate booleans with the offending flag named, and validates single-value cardinality before command execution. True collection flags retain accumulation.
Acceptance evidence: exact compiled candidate commands quest task list --status --json and --plain both exit 2 with --status requires a value; quest task list --status "To Do" --status "Done" --json exits 2 with --status may only be provided once; duplicate --actor and --include-archived both exit 2 and name the duplicated flag. Contract tests cover both modes for all 16 value-taking flags and every single-value repeat; compiled-binary tests cover missing and duplicate status.
Validation: Bun 1.3.14 (matching packageManager) built all six 0.2.2 natives using retained 1.3.14 cross-target compilers. typecheck, 150-test full suite, check:packages, test:packages, layer:check, targeted Biome lint/format, git diff --check, Lore strict validate, and Lore strict check passed. Repository-wide lint and format:check retain only the documented three nested Treehouse root-configuration failures. The handoff claim of five layer violations and Bun 1.2.23 was stale: current dev already contains QCLI-97.7 and the active Bun is 1.3.14.
Public boundary: focused discovery is 26P/7F with exactly the two QCLI-101 FAIL-to-PASS changes. Full harness is 302 rows, 235P/57F/10B versus 233P/59F/10B, again exactly those two flips and no regressions; mode precedence and quest/records filter verdicts are unchanged. QCLI-100 and QCLI-102 remain reproducible (help --json exits 3; version exits 2), so adjacent tasks were not folded in. QCLI-105 nested-resolution process guards pass in the 150-test suite.
Candidate identity: root launcher sha256 4c4a801394100767f483ef6ab55c944527fb9933060a5fe004e95f4dda860ab2; darwin-arm64 native sha256 8ae73c74536b28870532e94d97686ee1c65ac094f69a357ec1139bcba6fffb9e. Exact staged candidate: /private/tmp/quest-v0.2.2-qcli101.1NYgC7/candidate. Global npm replacement failed EPERM while npm attempted its atomic symlink in the NVM global @opum-ai directory, even with approved elevation and a writable isolated cache; the existing global launcher remains 4c4a8013... but native remains f89ad3fa..., so the installed command does not match this candidate.

Wave-2 reconciliation on origin/dev 8606e54 preserved QCLI-98 human rendering and QCLI-108 repository-check scope, extended the value matrix to all 19 current manifest value flags (including migration --source, --backlog-dir, and --digest), and added explicit accumulation coverage for --label, --doc, --add-label, --remove-label, and --task. All six 0.2.2 platform binaries were rebuilt from the combined source and rechecksummed. Two independent reviewers approved; focused 15/15, full check, check:packages, and packed-package gates passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed QCLI-101 by making flag-shaped missing values and duplicate single-value/boolean flags precise usage errors before command execution; intentional collection flags still accumulate. Added all-value-flag source coverage plus compiled-native regressions, bumped the local candidate to 0.2.2, rebuilt and checksummed all six platform packages, and proved exactly two FAIL-to-PASS changes across the 302-row external baseline with no regressions. All repository/package/Lore gates pass except the documented Treehouse-wide Biome root-config invocation. Global replacement remains host-blocked by npm EPERM; the exact staged candidate and owner-run recovery action are retained.

Wave-2 reconciliation closed the residual AC5 evidence gap and regenerated every native artifact from the combined migration/parser/renderer source without regressing QCLI-98 or QCLI-108.
<!-- SECTION:FINAL_SUMMARY:END -->
