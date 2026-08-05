---
id: QCLI-23
title: >-
  Re-verify QCLI-2.7 drift table against lore-cli v0.1.1 and refresh dependent
  documents
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 17:37'
updated_date: '2026-08-05 18:29'
labels:
  - campaign
  - research
  - lore
  - provenance
  - correction
  - no-implementation
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:provenance'
dependencies: []
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The wave-2 integration review found that lore-cli has cut v0.1.1 and published @opum-ai/lore@0.1.1 since QCLI-2.7 was last verified, which QCLI-2.7 own text names as an explicit reclassification trigger: cutting a new tag must trigger re-verification of MIN_BACKLOG_VERSION and EXPECTED_SCHEMA_VERSION and the drift table, not silent reuse of the old numbers. No task has serviced that trigger. The good news, already independently confirmed by the integration review: the four adapter-surface paths (cli-surface.md, cli-contract.md, okf-projection-contract.md, src/adapters/backlog.ts) are byte-identical between v0.1.0 and v0.1.1, and MIN_BACKLOG_VERSION and EXPECTED_SCHEMA_VERSION are unchanged, so no Part 2 reclassification follows from this task. Three Part 3 drift-table rows are nonetheless now factually false rather than merely dated: the recorded dev HEAD SHA, the commit-count comparison between the tag side and devs side, and the tag-is-an-ancestor-of-dev-HEAD answer, which has flipped. The research source register and the packaging contract both still cite the old v0.1.0 pin with no cross-reference to the newer capsule QCLI-11 already recorded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Re-verify lore-cli current release state live (tag, npm version) and re-run the four adapter-surface-path diffs QCLI-2.7 names, recording that no Part 2 reclassification follows if they remain byte-identical
- [ ] #2 The Part 3 drift table in the lore dependency and adapter contract evidence document is corrected to the current dev HEAD SHA, the current commit-count comparison, and the current tag-ancestor-of-dev-HEAD answer, all dated and citing this task
- [ ] #3 The research source register row citing the lore-cli release evidence is refreshed to the current retrieval date and version, cross-referencing QCLI-11 own evidence record rather than leaving the two capsules silently inconsistent
- [ ] #4 The packaging contract row citing @opum-ai/lore is refreshed the same way
- [ ] #5 No gate evaluation is performed or implied by this task -- it records evidence only, preserving the boundary discipline QCLI-11 established
- [ ] #6 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verify live: lore-cli tags (v0.1.0, v0.1.1 only, confirmed via git ls-remote/gh api against authoritative origin, not the local /Volumes/external/repos/lore-cli clone which has uncommitted WIP and a diverged local dev branch from a concurrent process), npm @opum-ai/lore dist-tags (latest=0.1.1), and re-run the 4 adapter-surface-path diffs v0.1.0..v0.1.1 (git diff --stat, all 4 paths, both together and individually) -- expect empty, confirming no Part 2 reclassification.
2. In quest-cli-lore-dependency-and-adapter-contract-evidence.md Part 3: update only the 3 rows the task names as now-false (dev HEAD SHA, ahead/behind count, tag-ancestor answer) against origin/dev (authoritative live ref, not the volatile local clone), dated 2026-08-05 and citing QCLI-23, explaining the ancestor flip (lore-cli PR #300 merged main, containing v0.1.0's commit, back into dev on 2026-08-03). Leave the tag-side facts (v0.1.0 pin, npm/local version at pin time) and the "None" drift rows untouched since independently re-verified still true against the new dev HEAD. Add a dated addendum recording the v0.1.0..v0.1.1 diff result (AC1) and confirm MIN_BACKLOG_VERSION/EXPECTED_SCHEMA_VERSION unchanged, and a note that the reclassification trigger fired and was serviced by this task.
3. In quest-cli-research-source-register.md's "lore-cli / the `lore` command" slice: append a dated 2026-08-05 QCLI-23 re-verification note to the "Exact revision or retrieval date" bullet recording the v0.1.1 tag/npm figures, cross-referencing QCLI-11's activation-gate-evidence-record.md (which first surfaced v0.1.1), and noting the version-bump reclassification trigger did not fire because the documented CLI surface stayed byte-identical.
4. In quest-cli-packaging-contract.md's registry-evidence table: update the @opum-ai/lore row's version cell to 0.1.1 and add a dated "Refreshed 2026-08-05 by QCLI-23" note (matching the existing QCLI-14 correction-note convention immediately below the table) citing QCLI-11's evidence record and the re-checked unchanged fields (license/repository/maintainer/bin).
5. No gate evaluation anywhere -- only evidence recording, matching QCLI-11's boundary discipline.
6. Run `lore validate --strict`, `lore check`, `lore orphans` and confirm clean; fix any managed-block/link issues via lore, not manual edits.
7. Record notes with full command+output evidence for each AC, commit in small logical commits with `Refs: QCLI-23`, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Live re-verification (AC1) — 2026-08-05, ~18:08-18:12 UTC

lore-cli local clone at /Volumes/external/repos/lore-cli was found DIRTY at
re-verification time: uncommitted working-tree edits (docs/reference/cli-surface.md
among others) and a local `dev` branch 28 commits ahead of `origin/dev` (someone
else's concurrent, unpushed work) -- its SHA even changed between two consecutive
`git branch -vv` calls in this session. Treated as unreliable; used `origin/dev`
(cross-checked via `gh api repos/opum-ai/lore-cli/branches/dev --jq .commit.sha`
and `git ls-remote origin dev`, both = `aedf64ae10ba83401d7bc49ab8584337222a3ed1`)
as the authoritative live reference for all dev-relative facts instead.

- `npm view @opum-ai/lore versions --json` -> ["0.1.0","0.1.1"]; `dist-tags` -> latest=0.1.1. No tag beyond v0.1.1 exists.
- `gh api repos/opum-ai/lore-cli/tags` + `git tag -l -n1` (remote refs) -> only v0.1.0 (e621d209be2cc8867d1c38c7c78b4b4acc96d82e) and v0.1.1 (e7fe3394109830a89fcdf16a675d0636446bcd79) exist. Confirms v0.1.1 is current.
- Four adapter-surface paths, v0.1.0..v0.1.1 (git diff --stat, jointly and individually): cli-surface.md, cli-contract.md, okf-projection-contract.md, src/adapters/backlog.ts -- ALL EMPTY. Byte-identical.
- `git show v0.1.1:src/adapters/backlog.ts | grep MIN_BACKLOG_VERSION|EXPECTED_SCHEMA_VERSION` -> MIN_BACKLOG_VERSION="1.49.0", EXPECTED_SCHEMA_VERSION=1 -- both unchanged from Part 2's cited values.
- Conclusion recorded in-doc (Part 2 addendum + Part 3 new row + reclassification-trigger addendum): no Part 2 reclassification follows. Confirms task description's claim independently rather than trusting it.

## Part 3 drift-table correction (AC2)

Methodology: Part 3's table runs all commands "in /Volumes/external/repos/lore-cli"
and compares lore-cli's OWN tag against lore-cli's OWN dev branch (not quest-cli's
dev -- verified this by re-reading the table header and every command in it,
which are all scoped to the lore-cli clone). The orchestrator's suggested fallback
(quest-cli's own dev / WAVE_BASE dff6283) does not match the document's actual,
established methodology, so it was not used -- per the instruction to follow the
document's existing convention rather than invent a new one.

Only the 3 rows the task names as now-false were corrected (dev HEAD SHA,
ahead/behind count, ancestor answer), all against origin/dev:
- dev HEAD: 405606891a227a9012b87de625d909eba56fec6b (2026-08-04, stale) -> aedf64ae10ba83401d7bc49ab8584337222a3ed1 (2026-08-05, current)
- Ahead/behind: `1  29` -> `0  103` (git rev-list --left-right --count v0.1.0...origin/dev)
- Ancestor: No -> YES (flipped). `git merge-base --is-ancestor v0.1.0 origin/dev` succeeds now.
  Root cause investigated and cited: commit 40dc5ad8 ("Merge pull request #300
  from opum-ai/dev", authored 2026-08-03T22:13:08-05:00, parents = e621d209...
  [the v0.1.0 tag commit] + f22ed526...) merged main back into dev, which the
  2026-08-04 capsule's own text said had not happened. Verified via
  `git log -1 --format='%H %P' 40dc5ad8...` and a scan of origin/dev's full
  commit list for any commit whose parent list contains e621d209....

The 2 "None" drift rows (adapter-surface source drift, documented CLI/adapter
surface drift) were independently re-checked against the new origin/dev (now
103 commits ahead, not 29) and both remain empty/None -- added as supporting
re-verification evidence, values unchanged. The "what the 29 commits touch"
rows and "Published npm 0.1.0"/"Tag v0.1.0 commit" rows were deliberately left
untouched: they are immutable, still-true historical facts about the fixed
v0.1.0 pin, not the kind of moving-dev-relative fact the task names as false.

Added: a new Part 3 row for the v0.1.0..v0.1.1 diff (AC1's finding, dated,
in-doc), a dated addendum to the "Pinned revision and source-currency
statement" prose paragraph in Part 2 (which restated the same 3 stale facts),
and a "Trigger serviced 2026-08-05" addendum after the reclassification-trigger
paragraph explicitly confirming the AC6-named trigger fired and was serviced
by this task, with no Part 2 reclassification and no pin migration to v0.1.1
(Part 2 stays cited to v0.1.0 since nothing in it changed).

## Research source register refresh (AC3)

Appended a dated 2026-08-05 QCLI-23 note to the "lore-cli / the `lore`
command" slice's "Exact revision or retrieval date" bullet: records the
v0.1.1 tag/npm figures (re-verified live, matching QCLI-11's independently
recorded figures exactly), cross-references QCLI-11's activation-gate
evidence record by anchor link (#discrepancies-found) as the FIRST capsule
to observe v0.1.1 (2026-08-05, same day), and explicitly notes this slice's
own "version bump changing the documented CLI surface" reclassification
trigger did NOT fire, citing QCLI-23's own Part 3 confirmation.

## Packaging contract refresh (AC4)

Updated the `@opum-ai/lore` row's Version cell in place (0.1.0 -> 0.1.1) and
added a "Refreshed 2026-08-05 by QCLI-23" note directly below the existing
"Corrected 2026-08-05 by QCLI-14" note, following that note's established
convention exactly. Live-rechecked Repository/License/Maintainers/Bin against
@opum-ai/lore@0.1.1 -- all unchanged (npm view @opum-ai/lore license/repository.url/maintainers/bin).
Cross-references QCLI-11's evidence record as the first observer of v0.1.1.

## Gate-evaluation boundary (AC5)

No Pass/Fail assertion made anywhere. Every new sentence added either (a)
reports a Part 2/adapter-surface finding (byte-identical diff, unchanged
constants) which is explicitly NOT the LDOC-4 gate predicate, or (b) records
a dated git/npm/gh fact. No text asserts or implies LDOC-4's status changed;
LDOC-4 itself was not touched or re-queried by this task (out of this task's
named scope -- QCLI-11 already recorded it To Do on 2026-08-05, same day,
cited read-only where relevant).

## lore validation (AC6)

- `lore validate --strict` -> 42 files, 0 errors, 0 warnings, 6 skipped. Exit 0.
- `lore check` -> initially 2 errors (status-drift + managed-block-drift on
  the parent story, from marking QCLI-23 in-progress) -- resolved via
  `lore sync` (the standard reconciliation step, not a manual edit): updated
  docs/log.md and docs/stories/prepare-quests-clean-room-research-foundation.md,
  committed backlog/ (1 file, commit 54712cd). Re-ran `lore check` -> 42 files,
  0 errors, 0 warnings. Exit 0.
- `lore orphans` -> 0 orphan tasks, 0 dangling links both before and after. Exit 0.

## Out-of-scope discoveries (not acted on)

- The local /Volumes/external/repos/lore-cli clone is shared/volatile: it has
  uncommitted WIP touching cli-surface.md (one of the four adapter-surface
  paths) and a local dev branch diverged from origin by unpushed commits whose
  tip changed mid-session. Not lore-cli's problem to fix from quest-cli, and
  not acted on here beyond routing all live facts through origin/dev instead
  of the local branch. Flagging in case another concurrent workstream is
  mid-edit on lore-cli docs.
- No other document was found directly echoing the stale v0.1.0 pin beyond the
  three named in this task (spot-checked via grep across docs/ for "v0.1.0"
  and "@opum-ai/lore" -- only the three target documents plus already-correct
  QCLI-11/QCLI-2.7 historical citations of v0.1.0 as a dated fact, which are
  correctly left alone as historical record, not live pins).

Fix pass after independent review returned request_changes (2026-08-05):

BLOCKING #1 fixed — docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md, Part 3, "Is the tag an ancestor of `dev` HEAD?" row. Reviewer found the "Cause" clause had the merge direction and causal commit backwards: it attributed reachability to 40dc5ad8 merging `main` back into `dev`, but 40dc5ad8 is lore-cli PR #300 (base=`main`, head=`dev` — a dev-to-main promotion, opposite direction) and was not reachable from `dev` until ~18.5h later. Independently re-verified before rewriting: `gh pr view 300 --repo opum-ai/lore-cli` (base=main, head=dev, merged 2026-08-04T03:13:08Z); `gh pr view 310` (base=dev, head=release/0.1.1-publication, merged 2026-08-04T21:44:25Z, merge commit 6bb4f9d9, parents [77deb736, 1f0c2c62]); `gh api compare/40dc5ad8...8dc88bdd` and `.../40dc5ad8...77deb736` (both diverged, behind_by=2 — not yet ancestors); `gh api compare/40dc5ad8...1f0c2c62` (behind_by=0 — release branch tip already contained it); `gh api compare/main...dev` (diverged, ahead_by=2, behind_by=4 — main and dev are still not merged back together in general). Rewrote the Cause clause to name PR #310 / release/0.1.1-publication as what carried main's history (and the v0.1.0 tag commit) into dev via a one-time release-branch merge, corrected the PR #300 direction, and removed the implication that dev now merges main back into itself generally.

NON-BLOCKING #1 folded in — added a dated parenthetical ("as of the 2026-08-04 range v0.1.0..4056068, since superseded by the 103-commit range above") to the two undated "What the 29 commits actually touch in src/ / docs/" rows, so they read as historically scoped rather than describing the current 103-commit range.

Left non-blocking #2 (finalization/AC-checking) and #3 (missing Refs: trailer on 54712cd) untouched — out of scope for this pass per orchestrator instruction.

Verified clean after edit: lore validate --strict (42 files, 0 errors, 0 warnings, 6 skipped), lore check (42 files, 0 errors, 0 warnings), lore orphans (0 orphan tasks, 0 dangling links).
<!-- SECTION:NOTES:END -->
