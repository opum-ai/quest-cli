---
id: QCLI-55
title: >-
  Retire wave-loop.md's not-yet-exercised claim for merge-pending's point of
  action
status: Done
assignee:
  - '@codex'
created_date: '2026-08-08 18:29'
updated_date: '2026-08-14 12:18'
labels:
  - wave-3
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
modified_files:
  - .claude/skills/backlog-handover/reference/wave-loop.md
  - .claude/skills/backlog-handover/SKILL.md
priority: medium
type: chore
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`reference/wave-loop.md` section (f)'s Evidence paragraph states that "`merge-pending`'s own point-of-action edit (step 2 above) **has not yet been separately exercised in a recorded wave** … that reuse itself is not yet direct evidence (`QCLI-51`)."

doc-13 wave 1 exercised it. `in-review` was applied at review dispatch, transitioned to `merge-pending` on the reviewer's `approve` verdict, both left uncommitted and discarded before the rebase, and the real label set reconstructed at settlement.

Confirmed on the merged result rather than from session narration: `QCLI-52`'s task file on `dev` carries only `campaign`, `cluster:skill-docs`, `wave-1` — neither review-adjacent label — and no committed task frontmatter anywhere in the repo carries either. That is `QCLI-51`'s durability claim confirmed empirically for the first time under a `merge-pending` transition. Merge commit: `d652126`.

The statement became false the moment doc-13's wave-1 log entry was written.

## Routing — two different treatments, deliberately

The same sentence appears twice, and CLAUDE.md's record-vs-current-assertion test sends the two occurrences different ways:

- `reference/wave-loop.md` (f) is **operative prose calibrating a reader's trust today** → correct in place.
- `SKILL.md`'s `QCLI-51` Provenance entry repeats it as a **dated record of what `QCLI-51` knew** → it must not be silently corrected or re-tensed. `QCLI-50`'s tense-only carve-out does **not** rescue an edit here, because reversing what the record asserts is not a tense-only edit. It gets an inline dated supersession amendment citing the directing task per the `QCLI-44` ruling, or is left intact.

## Why this is not folded into QCLI-53

The line sits inside section (f) — the section `QCLI-53` edits — but is outside all eight of `QCLI-53`'s acceptance criteria. Fixing it there would be exactly the drive-by the reviewer checklist's scope item flags.

## A second thing worth recording while here

doc-13 wave 1 was **size 1**, which collapses (f) step 4's discard deadline ("before that branch's rebase") and (g)'s precondition ("clean before the walk starts") onto the same instant. That run therefore supplies **no** evidence discriminating the two readings and must not be cited as a worked case toward `QCLI-53`.

## Origin

Surfaced by doc-13 wave 1's integration review (2026-08-08) and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 reference/wave-loop.md section (f)'s Evidence paragraph cites doc-13 wave 1 as direct evidence for merge-pending's step-2 point of action, naming merge commit d652126 and what was observed, and the 'not yet been separately exercised' claim is removed as current prose
- [x] #2 SKILL.md's QCLI-51 Provenance entry is treated as a record: either left intact, or amended inline with a dated superseded-marked note citing the directing task per the QCLI-44 ruling. It is not silently corrected or re-tensed
- [x] #3 The evidence cited is verifiable from committed state (the merged task file's labels, and the absence of either label in any committed task frontmatter), not from session narration
- [x] #4 It is recorded that doc-13 wave 1 was size 1 and therefore does not discriminate (f) step 4's discard deadline from (g)'s clean-checkout precondition, and supplies no evidence toward QCLI-53
- [x] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verify doc-13 wave 1 at merge commit d652126: the merged QCLI-52 task labels, repository-wide absence of committed in-review/merge-pending labels, and the campaign log's size-1 limitation.
2. Replace reference/wave-loop.md section (f)'s stale current Evidence claim with the verified doc-13 observation and an explicit statement that the size-1 wave supplies no evidence toward QCLI-53.
3. Preserve SKILL.md's dated QCLI-51 Provenance text and append a dated supersession note citing QCLI-55, plus a new QCLI-55 Provenance entry; keep version 0.9.1-qcli.9 with an explicit no-bump justification because mechanics do not change.
4. Run focused term and committed-state sweeps, git diff --check, and an adversarial self-review against all five acceptance criteria; record exact evidence before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the evidence-only QCLI-55 correction in the leased wave-3 worktree at integration base 4e7a2c0425cc1e870f625ae8f8033b40ffac7396.

Changes:
- reference/wave-loop.md section (f) now cites doc-13 wave 1 and merge d652126 as the direct merge-pending exercise, names the observed in-review -> merge-pending -> discard -> settlement sequence, grounds durability in committed QCLI-52 frontmatter, and states the size-1 limitation against QCLI-53.
- SKILL.md preserves the QCLI-51 Provenance paragraph byte-for-byte and adds an adjacent 2026-08-13 superseded-evidence note citing QCLI-55.
- Skill version remains 0.9.1-qcli.9: the edit changes evidence only and leaves workflow behavior, stage transitions, discard timing, and recovery rules unchanged, matching the qcli.7 evidence-fix precedent.

Verification:
- backlog doc view doc-13 --plain contains both 'First exercise of merge-pending's point of action' and 'This wave supplies no evidence toward QCLI-53'.
- git show d652126:<QCLI-52 task path> confirms labels are campaign, cluster:skill-docs, wave-1.
- git grep -n -E '^[[:space:]]+- (in-review|merge-pending)$' d652126 -- 'backlog/tasks/*.md' exited 1 with no output, confirming neither exact label exists in committed task records at that revision.
- Baseline/current line comparison confirms the QCLI-51 Provenance paragraph is byte-identical.
- Baseline/current frontmatter comparison confirms the version is unchanged.
- Focused operative-prose check confirms the stale 'has not yet been separately exercised' claim is absent from wave-loop.md while the direct evidence and size-1 caveat are present.
- git diff --check passed.
- No package.json or automated product gate exists at this repository root; this task changes only Markdown under .claude/skills and was verified against its committed evidence and acceptance criteria.

Adversarial self-review (not independent; subagents were not authorized):
- AC1 confirmed: operative wave-loop Evidence names doc-13 wave 1, d652126, the in-review -> merge-pending -> uncommitted discard -> settlement sequence; the stale current claim is absent.
- AC2 confirmed: origin/dev and working-tree extraction of the QCLI-51 Provenance paragraph are byte-identical; the adjacent amendment is dated, marked Superseded evidence note, and cites QCLI-55.
- AC3 confirmed: the committed doc-13 campaign record supplies the transition narrative; git show at d652126 shows exactly campaign, cluster:skill-docs, wave-1 on QCLI-52; the exact committed-label search returned no in-review or merge-pending entries.
- AC4 confirmed: both the committed doc-13 wave log and the new operative Evidence text state wave size 1 collapses the two deadlines and is not evidence for QCLI-53.
- AC5 confirmed: the Provenance amendment records the change and baseline/current frontmatter is byte-identical at 0.9.1-qcli.9; no-bump reasoning explicitly distinguishes evidence from behavior.
- Scope review: source changes are limited to the two declared modified files; the only other diffs are serialized QCLI-55 and doc-15 Backlog bookkeeping. No docs/ files changed.
- Residual delivery limitation: implementation is verified but remains uncommitted in leased Treehouse slot 1 because commit, push, PR, merge, and cleanup were not authorized. QCLI-55 therefore remains In Progress and receives no final summary or Done transition.

Authorized delivery completed: branch head f069c7e638db5aae12b92bd949c279c1beb681aa was pushed and reviewed through PR #79, then squash-merged to dev as 127445f5bfebfd24e664fe88105cc970d53d4972.
Post-merge verification: origin/dev equals 127445f5bfebfd24e664fe88105cc970d53d4972; reviewed-head and integration trees are identical; the integration message parses `Refs: QCLI-55`; `git diff --check 127445f5^ 127445f5` passes; the committed evidence checks remain unchanged. No reported PR checks existed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected the live backlog-handover evidence to cite doc-13 wave 1's recorded merge-pending exercise at d652126, preserved QCLI-51's dated Provenance text with a QCLI-55 supersession note, and documented the size-1/QCLI-53 limitation without changing skill version or behavior. Verified from committed task/tracker state, exact-label and byte-preservation checks, git diff --check, and adversarial self-review; delivered through PR #79 as 127445f5bfebfd24e664fe88105cc970d53d4972 with a parsed Refs: QCLI-55 trailer and a tree identical to reviewed head f069c7e638db5aae12b92bd949c279c1beb681aa.
<!-- SECTION:FINAL_SUMMARY:END -->
