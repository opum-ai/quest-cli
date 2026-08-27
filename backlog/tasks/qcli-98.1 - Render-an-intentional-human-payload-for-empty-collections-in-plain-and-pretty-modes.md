---
id: QCLI-98.1
title: >-
  Render an intentional human payload for empty collections in plain and pretty
  modes
status: Done
assignee:
  - codex
created_date: '2026-08-26 00:22'
updated_date: '2026-08-27 14:52'
labels:
  - cli
  - output-contract
dependencies: []
parent_task_id: QCLI-98
priority: medium
type: bug
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-98 made every non-JSON invocation render the structured payload, but the generic renderer emits the bare JSON-ish '[]' for an empty array. The e2e harness (run 2026-08-25T23-44-32-722Z, invocations 0033/0037/0038) fails quest task list --plain, non-TTY default, and TTY pretty on an empty workspace because stdout is '[]' — not a human-readable payload. Fix the vertical render seam so empty collections render intentional human output in plain and pretty modes without changing JSON mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Empty task list under --plain renders intentional ANSI-free human output, not '[]' or JSON
- [x] #2 Non-TTY default output for an empty task list matches the plain rendering
- [x] #3 TTY pretty output for an empty task list renders human output
- [x] #4 JSON mode byte-identical to before for all payloads including empty lists
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on Opum lease b55b5fafbcff654408e4f6ce16178594 (branch qcli-plain-empty-list-render, base 03177b9). Generic renderer now emits '(empty)' for empty arrays; JSON unchanged. Red-first tests added; 168/168 tests, typecheck/lint/format/check:packages green. PR #146 to dev.

Settled under FMC correlation 8ed74eff8cc44171b3436ca1df85b1ae on Opum lease bd39d06a1eb54197b8293a5f14802751 (holder quest-cli-qcli-98-1-settlement, branch auto-derived by lease at base a6018aecbc8389370201d6655524ba64c76d5f14, primary_checkout=false). AC1-AC3 proven from the merged implementation PR #146 (MERGED as 9c5e31f1d9f7e073f8431f02b0a2028685f99799, proven ancestor of origin/dev; 13/13 SUCCESS checks: source-gates + 6-platform Projection matrix + Prepublication qualification) and the final installed-pair matrix opum-cli-e2e runs/odoc63-4-final-matrix-final (run 2026-08-27T13-32-43-001Z): 309 rows / 309 PASS / 0 FAIL / 0 BLOCKED, candidate binding /Volumes/external/.opum-candidates/opum-doc-qualification-2026-08-26/final-quest-a6018ae (= merged dev a6018ae). Matrix rows: quest task list --plain renders "(empty)" (invocation 0033 PASS -> AC1); non-TTY stdout auto-plain renders "(empty)" (0037 PASS -> AC2); TTY pretty renders "(empty)" (0038 PASS -> AC3). AC4 proven: JSON serialization branch untouched by 135b7fe/cc5d9b1 (render.ts covers plain/pretty only); matrix rows quest task list --json exit 0 kind task.list envelope (0021 PASS), mode precedence --json --plain returns byte-exact task.list JSON with data:[] (0035 PASS), repeated reads byte-identical (0303 PASS).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Settled to objective evidence without code change: merged PR #146 implementation (merge commit 9c5e31f, 13/13 checks green) plus the final 309/309 installed-pair matrix against exact candidate final-quest-a6018ae — plain/non-TTY/TTY empty-collection render "(empty)" (invocations 0033/0037/0038) and byte-exact JSON envelope including empty lists (0021/0035/0303). Task-record-only settlement delivered via PR to dev.
<!-- SECTION:FINAL_SUMMARY:END -->
