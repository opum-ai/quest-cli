---
id: QCLI-154
title: Fix actor-kind error message and multi-word --help detection
status: Done
assignee:
  - '@opag-directed'
created_date: '2026-08-30 17:25'
updated_date: '2026-08-30 17:26'
labels: []
dependencies: []
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
opag (fleet orchestrator) reported two CLI usability defects hit during live use: (1) an invalid --actor-kind value (e.g. 'agent') produced the exact same 'Tracker writes require an explicit actor declaration' error as omitting the flag entirely, so a user cannot tell a bad value from a missing flag; (2) --help/-h on a two-word subcommand (e.g. 'quest task edit --help') fell through to actually executing the command instead of showing usage, because the help detector only checked argv positions 0 and 1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An invalid --actor-kind value names the offending value and lists the valid kinds (human, delegated-agent) instead of the generic missing-actor message
- [x] #2 quest task edit --help, -h, and quest help "task edit" all print usage for exactly the task edit command instead of executing it
- [x] #3 Full check suite (bun run check) passes with new regression tests covering both fixes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Fix actor() in src/cli/main.ts to throw a FlagUsageError naming the offending --actor-kind value when it is present but not human/delegated-agent, instead of silently falling through to the generic missing-actor message at all 14 call sites.
2. Fix the help-detection block in runQuest to scan the whole argv for --help/-h (not just positions 0 and 1) and join everything before it as a (possibly multi-word) topic, so two-word commands like 'task edit' resolve.
3. Add regression tests in test/contract/cli-process.test.ts: invalid --actor-kind value names itself; task edit --help/-h and help "task edit" resolve to exactly the task edit command.
4. Run bun run format && bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause 1: actor() at src/cli/main.ts:449 returned undefined uniformly whether --actor-kind was missing or an invalid value, so every one of its 14 call sites emitted the same generic 'requires an explicit actor declaration' message. Fixed by throwing a specific FlagUsageError naming the bad value when --actor-kind is present but not human/delegated-agent, while still falling through to the existing per-call-site message when it is absent entirely.
Root cause 2: the --help/-h detector only inspected argv[0] and argv[1], so it worked for single-word commands (quest manifest --help) but never fired for two-word commands (quest task edit --help has the flag at argv[2]) -- those fell through to actually executing the command. Fixed by scanning the full argv for --help/-h (or a leading 'help' word) and joining everything before it as the topic, which also now supports multi-word topics like 'task edit' that the manifest already names (confirmed via src/contract/tracker/index.ts entry { name: "task edit" }).
Verified: bun run check passes -- 376/376 tests (up from 375, +1 new test with 3 sub-cases plus 6 new invocation variants in the existing help-spelling test), typecheck/lint/format/layer all clean except two pre-existing unrelated lint warnings (src/application/tasks/tasks.ts:928, test/qcli122-fourth-pass.test.ts:374) that predate this change and are out of scope.
Also checked opag's related claim that quest-cli's own docs/managed instructions say --actor-kind human|agent: false for this repo. src/application/agents/agent-instructions.ts (the actual managed template Quest installs) and docs/runbooks/quest-cli-operations.md both already correctly say human / delegated-agent. The agent kind claim was specific to opum-agent's own AGENTS.md, already fixed there per opag.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed both CLI usability defects opag hit today. (1) actor() in src/cli/main.ts now throws a FlagUsageError naming the bad --actor-kind value and listing the valid kinds instead of the generic missing-actor message, fixing all 14 write call sites at once. (2) the --help/-h detector now scans the full argv instead of only positions 0-1, so multi-word subcommands like 'task edit' resolve to usage instead of executing. Verified with bun run check: 376/376 tests pass, including 3 new regression cases for the actor-kind message and 6 new invocation variants proving task edit --help/-h/help resolve exactly to the task edit command.
<!-- SECTION:FINAL_SUMMARY:END -->
