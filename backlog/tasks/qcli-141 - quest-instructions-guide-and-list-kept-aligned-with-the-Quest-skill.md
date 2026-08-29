---
id: QCLI-141
title: 'quest instructions <guide> and --list, kept aligned with the Quest skill'
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 13:55'
labels:
  - cli
  - parity
  - onboarding
dependencies:
  - QCLI-134
  - QCLI-129
references:
  - src/application/agents/agent-instructions.ts
  - .claude/skills/quest/SKILL.md
priority: medium
type: feature
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest emits one fixed agent-instructions block. Backlog 1.50.1 serves five workflow guides - overview, task-creation, task-execution, task-finalization, init-required - through instructions <guide> plus --list for discovery.

Filed out of the QCLI-134 register with the owner deciding to implement now (2026-08-29), with one explicit requirement: the Quest skill shipped by QCLI-129 (.claude/skills/quest/SKILL.md, generated from the bundled questSkillContent constant) must stay aligned with these guides rather than becoming a third divergent copy of the same guidance. Quest already has two agent-facing surfaces - that skill and quest help <command> from QCLI-127 - so this work must consolidate, not add a parallel source of truth.

DESIGN DECISION, settled 2026-08-29: no "all" guide. Neither reference implementation has one - Backlog exposes [guide] plus --list, and Lore exposes [<topic>] and describes itself as task-scoped guidance "on demand". The purpose of splitting guides is just-in-time loading to keep agent context small; an "all" invites dumping every guide on every invocation and defeats that. --list already covers discovery, which is the real need.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quest instructions <guide> serves distinct guides, and quest instructions --list enumerates them with a one-line purpose each.
- [x] #2 Bare quest instructions keeps returning the managed agent-instructions block, so the existing agents --check / --update-instructions contract and every current caller are unaffected.
- [x] #3 There is no "all" guide, per the recorded decision.
- [x] #4 The Quest skill from QCLI-129 is reconciled against the guides: guidance lives in one place and the skill points at it rather than restating it, so the two cannot drift.
- [x] #5 The manifest declares the guide argument and --list, and a test fails if the skill and the guides duplicate guidance that could diverge.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
The consolidation in AC4/AC5 is the real work; the CLI surface in AC1 is small. Quest has three agent-facing surfaces today - the managed AGENTS.md block, questSkillContent, and 'quest help <command>' - and the skill already calls itself a thin pointer while still restating a Commands list, a Start here sequence, and the machine contract. Those restatements are what must move, not be copied.

1. New src/application/agents/guides.ts owning questGuides: an ordered record of {name, summary, content}. Five guides, mirroring the reference set where Quest has an equivalent: overview, task-creation, task-execution, task-finalization, workspace. No 'all' (AC3) - reject it explicitly with a usage error naming --list, so an agent that guesses gets told the right thing rather than a bare unknown-guide error.
2. Populate overview by MOVING the skill's Commands list, machine contract and when-to-use prose verbatim rather than authoring a second copy. The task-* guides are new but stay grounded in Quest's real commands and this repo's actual lifecycle: search before create; activate, plan, note; verify acceptance criteria against evidence, final summary, terminal status.
3. Reduce questSkillContent to an actual pointer: front matter, one paragraph on what Quest is, and 'run quest instructions --list'. It must no longer carry the Commands list, Start here, or the machine contract.
4. Move the QCLI-140 skill-verb drift guard onto the overview guide, since that is where the Commands list now lives. The guard's purpose is unchanged: a lifecycle verb in the manifest that no agent-facing surface mentions is drift.
5. CLI: bare 'quest instructions' unchanged (AC2), plus 'instructions --list' and 'instructions <guide>'. Guides are read-only, no actor.
6. Manifest and help: declare the guide argument and --list; kind agent.instructions stays for the bare form, new kinds for the list and a guide so callers can branch.
7. AC5 duplication test: collect sentences of eight or more words from questSkillContent and from every guide, normalize whitespace, and assert the intersection is empty. That fails the moment guidance is restated in both places, which is the drift AC4 exists to prevent. Confirm it red by copying a sentence back into the skill.
8. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-141-instructions-guides, commits 5693d5f + 6610ae8, off dev 4fdb72b (Opum lease 5d947673ab00d3b9c061455b4b36d543, slot 1).

Consolidation, not just the flag. New src/application/agents/guides.ts owns five guides - overview, task-creation, task-execution, task-finalization, workspace. The overview guide received the command list, machine contract and when-to-use prose that the skill had been carrying; that prose moved rather than being copied. questSkillContent is now front matter plus a paragraph plus five CLI entry points, 20 lines against 66. QCLI-140's verb drift guard moved with the command list onto the overview guide.

Independent review found the mechanism sound - it proved bare 'instructions --json' byte-identical to dev, and every argument-parsing edge case erroring correctly - and the CONTENT wrong in three places. All fixed in 6610ae8:
- BLOCKING: the finalization guide's closing recipe used 'task edit --final-summary', which does not exist; --final-summary is create-only, so the last step of every task exited 2. The guide now uses --add-note and states the limitation. Filed the underlying gap as QCLI-147, which should revert the guide when it lands.
- 'quest cleanup' does not touch tasks and there is no retention window in the codebase; it removes closed unreferenced milestones and superseded decisions. My new prose had elaborated the wrong claim into a lifecycle story. Corrected in the guide and in the cleanup help summary it was inherited from.
- 'agents --update-instructions' writes AGENTS.md and the skill file, never CLAUDE.md. Verified empirically. Corrected in the guide, the init prompt and two help summaries.
- The AC5 duplication test measured whole-sentence equality, which missed bullet lists with no terminal punctuation, stripped fenced code entirely, and lost to any trailing clause. It now measures eight-word shingle overlap, and immediately caught two reworded restatements the first version allowed.
- 'instructions -x' returned not_found rather than usage; a leading dash is a flag however many dashes it has.
- The repo's own tracked .claude/skills/quest/SKILL.md was regenerated, closing drift that predated this branch by one release. 'quest agents --update-instructions' also wanted to append a Quest managed block to this repository's AGENTS.md; that was reverted - AGENTS.md here is the FMC Worker contract and is not this task's to change.

Validation on 6610ae8: bun test 344 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files. The duplication guard was confirmed red by restating a sentence in the skill.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest emitted one fixed agent-instructions block, so an agent took all of Quest's guidance or none of it. Adds 'quest instructions <guide>' and '--list' over five guides: overview, task-creation, task-execution, task-finalization, workspace. No 'all' guide, per the recorded decision - asking for it returns a hint naming --list rather than a bare unknown-guide error.

The consolidation mattered more than the flag. Quest had three agent-facing surfaces, and the bundled skill, while already calling itself a thin pointer, still carried its own command list, getting-started sequence and copy of the machine contract. That prose moved into the overview guide; the skill is now front matter, a paragraph and the CLI entry points. Bare 'quest instructions' is byte-identical to before, so 'agents --check' and every existing caller are unaffected.

Two tests hold the line: one asserts the skill and the guides share no eight-word phrase, so restating guidance fails rather than drifting; the other, added by QCLI-140 against the skill's command list, now reads the overview guide.

Review caught the guides making three false claims - a 'task edit --final-summary' recipe that does not exist, a 'cleanup' retention-window story that is not what cleanup does, and a CLAUDE.md write that never happens. All three were corrected in the guides and in the help summaries two of them were inherited from; the --final-summary gap is filed as QCLI-147.

Verified by test/contract/command-contract.test.ts and test/cli-tracker-process.test.ts: the guide index and each guide's distinct content, the unchanged bare form, the absent 'all' guide, argument-parsing edge cases including flag-before-positional and single-dash typos, and the duplication guard - which was confirmed red by restating a sentence. Full suite: 344 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
