---
id: QCLI-2.13
title: Adopt a moving-vs-immutable reference convention in the research program Spec
status: Done
assignee:
  - '@claude'
created_date: '2026-08-04 14:35'
updated_date: '2026-08-04 22:57'
labels:
  - campaign
  - research
  - convention
  - verification
  - no-implementation
  - 'cluster:convention'
  - wave-3
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies: []
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
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
- [x] #1 The research program Spec Verification bar defines the moving-versus-immutable distinction and states the required phrasing for each
- [x] #2 It requires a recheck clause for any conclusion resting on a moving reference, and cites the two existing implementations in the corpus as the reference model
- [x] #3 It states that the convention binds new and amended documents and requires no retroactive rewrite of existing ones
- [x] #4 The convention is cross-referenced from the source registers GitHub-redirect reclassification trigger as the general case of that specific rule
- [x] #5 lore check --strict, lore validate --strict, and lore orphans report zero errors, zero warnings, and zero orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Baseline: confirmed lore check/validate/orphans all clean pre-edit (19 files, 0/0/0). Verified precedents live: QCLI-2.9's mandatory release-time recheck clause exists in docs/reference/quest-cli-packaging-contract.md under '#### Mandatory release-time recheck clause (AC1)' (lines ~143-155); QCLI-2.7's AC6 reclassification trigger exists in docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md under Part 3, 'Reclassification trigger, stated explicitly (AC6)' (lines ~360-367). Read the source register's 'lore-cli / the lore command' slice, whose Reclassification triggers bullet (lines ~354-361) states the GitHub rename/transfer redirect rule this task generalizes.
2. Expand the Spec's existing '### Verification bar' section (it already exists, under '## Design') with new subsections: (a) Moving vs. immutable references - defines the distinction and the two required phrasings verbatim from the task description; (b) Recheck clause requirement - requires a recheck clause for any conclusion resting on a moving reference, citing QCLI-2.9's and QCLI-2.7's clauses by file+heading as the reference model; (c) Scope - binds new/amended documents only, no retroactive rewrite; (d) Relationship to the source register - cross-references the register's lore-cli slice GitHub-redirect trigger as the specific instance this generalizes (link only, since the register is QCLI-2.11's file this wave, not mine - I cannot add the reverse link from the register into this Spec; I will flag that asymmetry via --comment for the orchestrator).
3. Run lore check --strict, lore validate --strict, lore orphans; fix any issues.
4. Verify each AC against the edited text with objective evidence (quote the section).
5. lore sync (real, once) as final step before push.
6. Record notes/comments on the task, commit with Refs: QCLI-2.13, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: expanded the existing '### Verification bar' section in docs/specs/quest-cli-pre-implementation-research-program.md with four new subsections under it: 'Moving vs. immutable references' (AC1 - defines the distinction and states both required phrasings verbatim), 'Recheck clause requirement' (AC2 - requires a recheck clause for any conclusion resting on a moving reference; cites QCLI-2.9's 'Mandatory release-time recheck clause (AC1)' in docs/reference/quest-cli-packaging-contract.md and QCLI-2.7's 'Reclassification trigger, stated explicitly (AC6)' in docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md as the reference model, both independently re-read and confirmed present verbatim before citing), 'Scope of the convention' (AC3 - binds new/amended documents, no retroactive rewrite required), and 'Relationship to the source register' (AC4 - cross-references the register's 'lore-cli / the lore command' slice Reclassification-triggers GitHub rename/transfer redirect rule as the specific instance this generalizes).

Validation (run from the worktree root after the edit, before lore sync):
- lore check --strict -> '19 files, 0 errors, 0 warnings'
- lore validate --strict -> '19 files, 0 errors, 0 warnings, 6 skipped' (skips are index.md/log.md, not concepts)
- lore orphans -> 'orphans: 0 orphan tasks, 0 dangling links'
All three: zero errors, zero warnings, zero orphans.

AC4 scope note: the register is QCLI-2.11's file this wave, read-only to me. My edit cross-references the register by name/heading FROM the Spec; I did not and could not add the reverse link (register -> Spec) since I don't own that file. See --comment for the orchestrator on whether a true bidirectional cross-reference requires a follow-up edit to the register.

Follow-up fix for integration review finding F3 (AC4 half-satisfied):
AC4 requires the register -> Spec direction (register's GitHub-redirect
reclassification trigger cross-referenced as the specific instance of the
Spec's general convention). Only the Spec -> register direction existed
(the Spec's "Relationship to the source register" subsection already
linked to the register's lore-cli slice). Fixed by appending one clause to
that register bullet (docs/reference/quest-cli-research-source-register.md,
"lore-cli / the `lore` command" slice, Reclassification triggers bullet)
stating that the GitHub rename/transfer-redirect trigger is the specific,
single-instance case of the research program Spec's Verification-bar
moving-vs-immutable-references convention, with an anchored relative link
to docs/specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references.
No reclassification, no narrowing of any permitted use, no other slice
touched. The Spec side's existing "Relationship to the source register"
subsection was left as-is (already accurate, no restructuring needed).
lore check --strict, lore validate --strict, and lore orphans all report
zero errors/warnings/orphans after the change. In my judgment this now
fully satisfies AC4 as worded (mutual cross-reference exists in both
directions); orchestrator to confirm at settlement.

Settlement (orchestrator, wave 3, 2026-08-04): reviewer independently confirmed ACs 1-3 and 5 on the original implementation (merged as squash commit eaa8a0c, PR #8), and judged AC4 confirmed-as-scoped but only one-directional (Spec cites the register; the register did not cite the Spec back). Wave-3 integration review adjudicated AC4's wording as requiring the register->Spec direction specifically, and recommended a narrow one-clause fix. A follow-up worker added that clause to the register's GitHub-redirect reclassification-trigger bullet; its reviewer independently proved the cross-reference link/anchor resolves (via a broken-link/broken-anchor negative control in a scratch copy) and confirmed a genuine mutual cross-reference now exists, explicitly stating AC4 is fully satisfiable. Follow-up merged as squash commit c09ed47 (PR #11). Gates on final merged dev: lore check --strict 21 files 0/0; lore validate --strict 21 files 0/0 6 skipped; lore orphans 0/0.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @claude
created: 2026-08-04 15:06
---
AC4 asymmetry for orchestrator review: I added a one-directional cross-reference FROM the Spec's new 'Relationship to the source register' subsection TO the research source register's 'lore-cli / the lore command' slice (its Reclassification-triggers GitHub rename/transfer redirect rule), naming it by heading/description per my dispatch instructions. I do not own docs/reference/quest-cli-research-source-register.md this wave (QCLI-2.11 does), so I did not add a reverse pointer from that register slice back to this Spec's new convention. If AC4 is read as requiring a true bidirectional cross-reference (the register's trigger explicitly pointing at the generalized convention, not just the generalization pointing at the trigger), that requires a small follow-up edit inside QCLI-2.11's file -- a one-line addition to the register's 'lore-cli / the lore command' slice noting that its GitHub-redirect trigger is now the specific instance of the Verification bar's general moving-vs-immutable convention. Flagging for orchestrator settlement rather than editing a file I don't own this wave.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Verification bar expansion to the research program Spec (docs/specs/quest-cli-pre-implementation-research-program.md) generalizing a pattern the corpus had already invented twice: moving references (branch HEAD, working-tree state, task status) must be recorded as dated observations with a recheck clause naming exact commands to re-run; immutable anchors (tags, SHAs, published versions) may be stated flat. A mutual cross-reference now exists between the Spec and the source register's GitHub-redirect reclassification trigger, completed via a follow-up fix after the integration review found the original implementation satisfied only one direction. No reclassification, no narrowing of any permitted use. Verified via 2 review passes on the original implementation plus 1 on the follow-up, including an empirical proof (broken-link/broken-anchor negative control) that the new cross-reference link actually resolves.
<!-- SECTION:FINAL_SUMMARY:END -->
