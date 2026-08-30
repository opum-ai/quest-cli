---
id: QCLI-148
title: >-
  Execute the instructions guides' own commands in a test, so a guide cannot
  ship a recipe that fails
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 15:13'
updated_date: '2026-08-29 17:30'
labels:
  - onboarding
  - contract
dependencies: []
priority: medium
type: feature
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-141's root cause was a fenced command in the task-finalization guide that exited 2 at the last step of every task: 'task edit --final-summary' did not exist. QCLI-147 made it exist, and the guide is correct again, but nothing stops the next guide edit from shipping an inexecutable recipe.

Review of QCLI-147 raised this after manually running every command in task-execution and task-finalization in sequence against a real store. That sequence is the test.

There is a real subtlety to design around: the recipes are not independent. 'task complete' from To Do exits 6 with an illegal-transition error, so the finalization guide is only correct because the execution guide sets In Progress first. A naive per-line runner would report a false failure. The test needs either an ordered run across guides or per-guide setup, and whichever it is should be stated rather than implied.

Filed from the QCLI-147 review, 2026-08-29.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A test extracts the quest commands from every guide in questGuides and runs them against a real store.
- [x] #2 The cross-guide ordering dependency is handled explicitly, not by accident: the test states why task-finalization needs task-execution's status change to have happened.
- [x] #3 The test fails if a guide contains a command the CLI rejects, verified by introducing one.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
The guides carry runnable commands and nothing runs them. QCLI-141 shipped 'task edit --final-summary' before the flag existed, so the finalization guide exited 2 at the last step of every task, and only a reviewer executing it by hand caught that.

The subtlety, from the QCLI-147 review: the recipes are not independent. 'task complete' from To Do is an illegal transition, so the finalization guide is correct only because the execution guide sets In Progress first. A naive per-line runner reports a false failure. Handle that explicitly rather than by accident.

1. Extract commands from questGuides: scan each guide's fenced blocks for lines beginning 'quest ', joining backslash continuations. Keep extraction dumb and visible - if a guide writes a command outside a fence, that is a guide bug worth surfacing, not something to be clever about.
2. Substitute placeholders. The recipes use <id>, <title>, <query>, <what changed...> and so on. Map each to a real value from a fixture task; fail loudly on an unrecognized placeholder rather than passing it through, so a new placeholder cannot silently become a literal argument.
3. Run the guides in dependency order - overview, task-creation, task-execution, task-finalization, workspace - against one store seeded with a task, a draft and a milestone, asserting exit 0 for each command. Record in a comment WHY the order matters, naming the To Do to Done transition as the reason.
4. Some commands cannot run in a shared sequence: 'quest init' needs an uninitialized worktree, 'browser' starts a server, 'migration backlog apply' needs a source project. Give those an explicit skip list with a stated reason each, so the skip is a decision rather than a silent gap, and assert the skip list only contains commands the guides actually mention.
5. Prove the test red by putting a bad flag in a guide.
6. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-148-executable-guides, commits 896503f + 651ab35, off dev a84b73e (Opum lease d419d980c3c913f6327486b295b98602, slot 1).

Two halves, because a guide says two kinds of thing. A fenced block is a recipe an agent will paste, so it must run: all seven execute against a real store and must exit 0. An inline backticked span is a reference, often deliberately incomplete, so the obligation is that the command and flags it names are real. Without the second half the overview and workspace guides would carry no coverage - they are almost entirely references.

Independent review mutation-tested the first commit and found three ways a broken recipe still shipped green, all the same shape: the extractor did not recognize something and skipped it silently, which is the worst property a guard can have. A language-tagged fence was invisible and its closing marker was consumed as an opening, so the NEXT bare fence was lost too. A shell prompt prefix or a CRLF file dropped a recipe the same way. And 'ran > 5' sat one below the actual 7, so exactly one recipe could vanish unnoticed.

Fixed in 651ab35 by closing the class rather than the three instances: fences may be tagged, lines may carry a prompt, CRLF is normalized, per-guide counts are exact, and any non-empty line inside a fence that is not a recognizable quest command now throws. Unrecognized input is a failure, not a skip.

Review also noted exit 0 proved only acceptance, so the test now asserts the end state the guides promise - terminal status, both plan steps, the note, both checkboxes, the final summary. And the reference half ignored flags entirely, so it now validates them against the command's help entry and checks that a cross-reference names a real guide.

Separately, the guides used <id> for both the task id and the actor id. Split to <actor>: clearer for the agents these are written for.

Not addressed, stated rather than assumed: the overview guide's command table uses bare spellings like 'task edit-batch' with no quest prefix, so mentionsIn does not see it. command-contract.test.ts already guards that table in the direction that matters - every manifest verb must appear in it.

Validation on 651ab35: bun test 355 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files. Every mutation the review found green was re-run and is now red: tagged fence, prompt prefix, silently dropped recipe, non-command line in a fence, bogus flag in a mention.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QCLI-141 shipped a task-finalization recipe calling a flag that did not exist, so the guide exited 2 at the last step of every task, and only a reviewer executing it by hand caught that. This is that check, automated.

Fenced recipes run against a real store and must exit 0; inline mentions must name a real command and real flags. The guides are executed in order because the ordering is load-bearing - task complete is illegal from To Do, so the finalization recipe is correct only because the execution guide already set In Progress - and the test says so rather than relying on it silently.

The substance of the second commit is that a guard which skips what it does not recognize is worse than no guard, because the guide looks covered. Review found three realistic authoring habits - a language-tagged fence, a shell prompt prefix, a CRLF file - each of which made a recipe disappear without a signal, and a loose floor that let one more vanish. Rather than patch three cases, any unrecognized line inside a fence now throws.

Verified by test/contract/guide-commands.test.ts. Beyond exit codes it asserts the state the guides promise their sequence produces, so a flag that is accepted and ignored no longer passes. Every mutation the review found green was re-run and is red: tagged fence, prompt prefix, dropped recipe, non-command line in a fence, bogus flag in a mention. Full suite: 355 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
