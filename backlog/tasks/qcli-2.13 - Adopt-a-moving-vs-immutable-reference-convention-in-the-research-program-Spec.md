---
id: QCLI-2.13
title: Adopt a moving-vs-immutable reference convention in the research program Spec
status: In Progress
assignee: []
created_date: '2026-08-04 14:35'
updated_date: '2026-08-04 15:07'
labels:
  - campaign
  - research
  - convention
  - verification
  - no-implementation
  - 'cluster:convention'
  - wave-3
  - in-review
dependencies: []
parent_task_id: QCLI-2
priority: medium
type: docs
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ten instances across three documents, two waves, and five task executions of a dated observation written as a standing fact — always the same conversion, always via the word "HEAD" or "current". The failure mode is specific: a worker runs a real command, gets a real answer, and writes it down using a word that silently converts an observation into a standing claim.

The corpus has already invented the fix twice independently, which is the argument for generalizing it rather than repairing sites one at a time: QCLI-2.9s mandatory release-time recheck clause (names the exact commands, forbids reuse of the dated observation, routes a changed result to the owner) and QCLI-2.7s AC6 reclassification trigger (states the literal git diff to re-run). It is also the general case of a rule the register already states for one instance — its GitHub-redirect trigger, that a stale org reference silently resolves so any citation using an org name must be re-verified against the live identity rather than assumed correct because a lookup succeeded.

Empirical support gathered during wave 2: opum-doc HEAD was measured three times inside a single review window and differed every time (7b512d9, then 5ebec80, then a5ac0c7). One reviewers own brief went stale while it was being written. The register text that survived this unharmed was the one phrased "then-current".

Proposed rule: a moving reference — branch HEAD, working-tree state, npm view availability, task status, an ahead/behind count — is recorded as <value> (observed <date>; moving reference, re-verify before relying). An immutable anchor — tag, commit SHA, published version, release timestamp — may be stated flat, because re-observation cannot change it. Any document whose conclusion depends on a moving reference carries a recheck clause naming the exact commands to re-run and what a changed result obligates.

Documentation only. This binds new and amended documents; it requires no retroactive rewrite, and QCLI-2.11 and QCLI-2.12 bring the currently-flagged sites into compliance as a side effect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The research program Spec Verification bar defines the moving-versus-immutable distinction and states the required phrasing for each
- [ ] #2 It requires a recheck clause for any conclusion resting on a moving reference, and cites the two existing implementations in the corpus as the reference model
- [ ] #3 It states that the convention binds new and amended documents and requires no retroactive rewrite of existing ones
- [ ] #4 The convention is cross-referenced from the source registers GitHub-redirect reclassification trigger as the general case of that specific rule
- [ ] #5 lore check --strict, lore validate --strict, and lore orphans report zero errors, zero warnings, and zero orphans
<!-- AC:END -->
