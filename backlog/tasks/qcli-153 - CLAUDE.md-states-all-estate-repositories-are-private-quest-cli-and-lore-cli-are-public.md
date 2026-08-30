---
id: QCLI-153
title: >-
  CLAUDE.md states all estate repositories are private; quest-cli and lore-cli
  are public
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-30 03:46'
updated_date: '2026-08-30 17:41'
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
- [x] #1 The visibility of every estate repository this instruction covers is checked and stated, rather than asserted as a blanket
- [x] #2 CLAUDE.md's 404-is-not-path-evidence guidance is scoped to the repositories where it actually holds
- [x] #3 The owner confirms whether quest-cli and lore-cli being public is intended; if it is not, that is handled as its own incident rather than inside this task
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1 and AC2 are done; AC3 is the owner's and stays open.

MEASURED, 2026-08-30, via 'gh api repos/opum-ai/<name> --jq .visibility':
  quest-cli     public
  lore-cli      public
  opum-cli-e2e  private

CLAUDE.md's blanket claim is replaced with the measured position and, more usefully, with the reasoning it changes: for a PRIVATE repository a 404 on a GitHub link is access-gating and not path evidence; for a PUBLIC one it is real evidence the path is wrong. The old instruction told an agent to discount a real signal on two of the three repositories it covers. It now says to verify visibility with the command above rather than assume either reading.

AC3 is not mine to close. Whether quest-cli and lore-cli being public is intended is an owner decision, and this task deliberately does not assume it either way. If it is intended, nothing further is needed. If it is not, it should be handled as its own incident rather than inside a documentation task - everything in a public repository is public, including the six committed platform binaries, the full backlog with its decision history, and the campaign trackers.

One consequence worth knowing either way, recorded on QCLI-97.6: GitHub environment protection rules, required reviewers included, are available on PUBLIC repositories regardless of billing plan. The lore-cli session could not add a required reviewer to their release environment because GitHub returned 422 on their plan. quest-cli being public means that control IS available here, so the second-party approval lore had to waive could be a real gate on quest's release workflow.

Owner confirmed 2026-08-30: quest-cli and lore-cli being public is intentional. No incident; visibility as-is is correct.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CLAUDE.md's blanket 'all estate repositories are private' claim was corrected to the measured per-repository visibility (quest-cli/lore-cli public, opum-cli-e2e and doc repos private), with the 404-is-not-path-evidence guidance scoped to where it actually holds. Owner confirmed the public visibility is intentional, closing the one open acceptance criterion.
<!-- SECTION:FINAL_SUMMARY:END -->
