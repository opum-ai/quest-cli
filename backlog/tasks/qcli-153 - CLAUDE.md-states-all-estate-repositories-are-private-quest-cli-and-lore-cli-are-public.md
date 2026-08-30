---
id: QCLI-153
title: >-
  CLAUDE.md states all estate repositories are private; quest-cli and lore-cli
  are public
status: To Do
assignee: []
created_date: '2026-08-30 03:46'
labels: []
dependencies: []
references:
  - CLAUDE.md
priority: high
type: bug
ordinal: 184000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CLAUDE.md asserts: 'All estate repositories are private. GitHub links are access-gated; a 404 is not path evidence.'

Measured 2026-08-30 via the GitHub API:
  opum-ai/quest-cli    visibility: public   (private: false)
  opum-ai/lore-cli     visibility: public
  opum-ai/opum-cli-e2e visibility: private

So the blanket claim is false for two of the three, including this repository. Two consequences, one editorial and one substantive.

EDITORIAL: the instruction tells an agent to treat a 404 on a GitHub link as inconclusive rather than as evidence the path is wrong. For a public repository that reasoning is inverted - a 404 IS path evidence - so the instruction currently causes an agent to discount a real signal.

SUBSTANTIVE, and the reason this is filed as a bug rather than a doc nit: if quest-cli is public unintentionally, then everything in it is public, including the six committed platform binaries (496MB), the full backlog with its internal decision history, and the campaign trackers. If it is public deliberately, that is fine and only the instruction is wrong. Which of those is true is an owner question and this task does not assume either.

A THIRD CONSEQUENCE WORTH KNOWING, because it bears on the release approval gate: GitHub environment protection rules - required reviewers in particular - are available on public repositories regardless of billing plan. The lore-cli session recorded that lore could not add a required reviewer because GitHub returned 422 on its plan. If quest-cli is public, that control IS available here, so the second-party approval that lore had to waive could be a real gate on quest's release workflow rather than an accepted risk.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The visibility of every estate repository this instruction covers is checked and stated, rather than asserted as a blanket
- [ ] #2 CLAUDE.md's 404-is-not-path-evidence guidance is scoped to the repositories where it actually holds
- [ ] #3 The owner confirms whether quest-cli and lore-cli being public is intended; if it is not, that is handled as its own incident rather than inside this task
<!-- AC:END -->
