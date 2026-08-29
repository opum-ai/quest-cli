---
id: QCLI-141
title: 'quest instructions <guide> and --list, kept aligned with the Quest skill'
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 13:24'
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
- [ ] #1 quest instructions <guide> serves distinct guides, and quest instructions --list enumerates them with a one-line purpose each.
- [ ] #2 Bare quest instructions keeps returning the managed agent-instructions block, so the existing agents --check / --update-instructions contract and every current caller are unaffected.
- [ ] #3 There is no "all" guide, per the recorded decision.
- [ ] #4 The Quest skill from QCLI-129 is reconciled against the guides: guidance lives in one place and the skill points at it rather than restating it, so the two cannot drift.
- [ ] #5 The manifest declares the guide argument and --list, and a test fails if the skill and the guides duplicate guidance that could diverge.
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
