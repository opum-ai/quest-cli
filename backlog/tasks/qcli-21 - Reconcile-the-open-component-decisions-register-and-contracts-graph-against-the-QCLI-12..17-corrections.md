---
id: QCLI-21
title: >-
  Reconcile the open component decisions register and contracts graph against
  the QCLI-12..17 corrections
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 14:36'
updated_date: '2026-08-05 15:38'
labels:
  - campaign
  - 'cluster:tracking-reconciliation'
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wave 1 (QCLI-12..QCLI-17) corrected six defects in the research corpus. Four of the six were tracked by rows in the open component decisions register's "Residual items recorded but never filed" table, and two more were audited without being closed -- but no wave task owned that table, so it still describes the pre-wave state. Two of those fixes also invalidated statements in sibling documents no wave task owned.

Concretely, on merged `dev`:

- `docs/reference/quest-cli-open-component-decisions.md:204-207` states the listed items "were never filed as tasks." Five of the ten were filed, as QCLI-12..QCLI-16.
- Rows at `:216` (QCLI-2.8 dependency order), `:218` (playbook backlink), `:220` (bin path in the Description column) are fully closed -- by QCLI-12 `1dd4aa6`, QCLI-13 `d871d32`, and QCLI-14 `077d3be` respectively.
- Row `:219` (licensing-source misattribution) is only half closed. QCLI-16 `44a7ed8` fixed it in the contracts and delivery graph; the same misattribution survives in this file's own D1 entry at `:93-95` ("Backlog.md's MIT license and the npm registry metadata this campaign read were admitted as naming-conflict and allocation evidence only"), directly contradicting the corrected authority text at `component-contracts-and-delivery-graph.md:577-589` -- which this file's preamble at `:28-31` names as authoritative over it. Striking the row without fixing D1 would delete the surviving defect's only tracking record.
- Rows `:217` (QCLI-2.12's F4/F5) and `:221` (untraceable Allowed value) remain genuinely open, but QCLI-15 `6b78fd0` audited both and re-characterized them. Their Source and Consequence cells no longer match what the register now records at `quest-cli-research-source-register.md:1064-1090` and `:1240-1274`.
- `docs/reference/quest-cli-component-contracts-and-delivery-graph.md:128-132` still asserts the Spec's Dependency order table "names only the six deliverables `QCLI-2.2`-`QCLI-2.7` ... not in the Spec's table." QCLI-12 made that false; the Spec's table at `:68` now names all ten.

All corrections are inline and dated per the repo's supersession convention. Nothing is silently rewritten.

Line numbers above are as observed by the wave-1 integration review immediately after merge; re-verify current line numbers before editing, since intervening commits may have shifted them slightly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The framing paragraph near open-component-decisions.md:204-207 is corrected to distinguish items still unfiled from items filed and closed in the QCLI-12..17 wave, citing the closing task and squash commit for each
- [ ] #2 The rows for the QCLI-2.8 dependency-order fix, the playbook backlink fix, and the packaging-contract bin-path fix are recorded as closed, each citing its closing task and commit (QCLI-12/1dd4aa6, QCLI-13/d871d32, QCLI-14/077d3be) and the file+location where the fix now lives -- not deleted without trace
- [ ] #3 The licensing-source-misattribution row is re-scoped, not struck: it records that QCLI-16 closed the contracts-graph instance and that the same misattribution survives in this file's D1 entry, remaining open until AC4 lands
- [ ] #4 D1 (License) is corrected to match component-contracts-and-delivery-graph.md's QCLI-16 correction: Backlog.md's MIT license is not admitted as naming-conflict/allocation evidence (it is discussed only under the register's "Backlog.md implementation source and internal tests" and "Backlog.md public surface" slices, on authorship-independence and ordinary-user-activity grounds); the npm registry metadata attribution is correct as stated. D1's Open status and owner are unchanged
- [ ] #5 The QCLI-2.12 F4/F5 row and the untraceable-Allowed-value row are updated to reflect QCLI-15's audit -- Source cites the audit, Consequence states the audited finding, and each names the closure condition QCLI-15 identified (for F4/F5, recovering the original reviewer text from an out-of-repo transcript if findable; for the Allowed value, an explicit owner ruling ratifying self-classification-by-vocabulary). Both remain listed as open
- [ ] #6 The QCLI-2.12 F4/F5 row carries a disambiguation note that QCLI-2.12's notes contain two independent F-numbering schemes, and that the wave-4 integration review's F4 (resolved via PR #17, c8dfdca) is a different item
- [ ] #7 component-contracts-and-delivery-graph.md's sentence asserting the Spec's Dependency order table names only six deliverables is corrected inline and dated: the Spec's table now names the full ten-item set as of QCLI-12 (1dd4aa6). The surrounding argument about what QCLI-2.8 synthesized is unchanged, and any separate "synthesis of six deliverables" claim elsewhere in the document is verified and left alone unless independently wrong
- [ ] #8 The garbled provenance clause in component-contracts-and-delivery-graph.md's QCLI-16 correction note (missing a word, reads as a grammar error) is repaired without altering the correction's substance, dating, or attribution
- [ ] #9 The remaining rows in the residual-items table (platform matrix, quest-doc actor model, Backlog.md browser HTTP endpoint, LCLI-316) are verified still accurate and left unchanged
- [ ] #10 docs/reference/quest-cli-research-source-register.md is not edited by this task
- [ ] #11 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verified all cited line numbers/SHAs on this worktree's dev-based branch: open-component-decisions.md's residual-items table rows sit at exactly the lines the task description cites (204-207 framing, 216/217/218/219/220/221), and all five SHAs (QCLI-12 1dd4aa6, QCLI-13 d871d32, QCLI-14 077d3be, QCLI-15 6b78fd0, QCLI-16 44a7ed8) resolve via git show to the exact commits named. No drift found.

2. docs/reference/quest-cli-open-component-decisions.md edits (AC1-3, AC9):
   a. Framing paragraph (~204-207): rewrite to state that 6 of the 10 residual items were touched by the QCLI-12..17 wave (4 fully closed: QCLI-2.8 dependency-order/QCLI-12/1dd4aa6, playbook backlink/QCLI-13/d871d32, bin-path/QCLI-14/077d3be, licensing misattribution/QCLI-16+this task; 2 audited-not-closed: QCLI-2.12 F4/F5 and the Allowed-value gap, both QCLI-15/6b78fd0) and 4 remain genuinely unfiled (platform matrix, quest-doc actor model, browser HTTP endpoint, LCLI-316), following this doc's own established correction convention (see QCLI-17's rewrite of the version-pin section: rewrite the stale prose directly, then close with a dated correction note citing what it used to say and why).
   b. Row for QCLI-2.8 dependency-order fix: mark closed, cite QCLI-12/1dd4aa6, point at the Spec's Dependency-order table (now fixed).
   c. Row for playbook backlink: mark closed, cite QCLI-13/d871d32, point at component-charter.md:28 and former-ocli-to-qcli-migration-ledger.md:123.
   d. Row for bin-path: mark closed, cite QCLI-14/077d3be, point at packaging-contract.md's new Bin column (~line 80).
   e. Row for licensing misattribution: re-scope (not strike) — record QCLI-16/44a7ed8 closed the contracts-graph instance, and that the D1 instance below is closed by this same task (QCLI-21) as part of landing AC4; net result both instances now closed.
   f. D1 bullet: correct per AC4 — Backlog.md's MIT license is not naming-conflict/allocation evidence (only discussed under "Backlog.md implementation source and internal tests" and "Backlog.md public surface" slices, on authorship-independence/ordinary-user-activity grounds); npm registry metadata attribution stands as originally stated. Inline dated correction citing QCLI-21 (this task; no squash SHA exists yet for a task correcting its own file mid-flight, matching the QCLI-17 precedent of self-citing without a commit hash). Status/owner cells (Open/Product owner) unchanged.
   g. Row for QCLI-2.12 F4/F5: rewrite Source (cite QCLI-15/6b78fd0 audit), Consequence (state audited finding: substance never recorded anywhere retrievable, confirmed via git log/fsck/gh api pulls/14 reviews+comments), closure condition (recover original reviewer text from an out-of-repo transcript if findable), plus AC6's disambiguation note (QCLI-2.12 notes carry two independent F-schemes; wave-4 integration review's separately-numbered F4, resolved via PR #17/c8dfdca, is a different item).
   h. Row for untraceable Allowed value: rewrite Source (cite QCLI-15/6b78fd0), Consequence (state audited finding per the register's Traceability audit note), closure condition (explicit owner ruling ratifying self-classification-by-vocabulary).
   i. Verify (no edit) rows: platform matrix, quest-doc actor model, browser HTTP endpoint, LCLI-316 — cross-checked against current D3/D6 status and no wave task touched them; leave unchanged per AC9.

3. docs/reference/quest-cli-component-contracts-and-delivery-graph.md edits (AC7-8):
   a. Lines ~128-131: replace the false "names only the six deliverables ... not in the Spec's table" sentence with an inline, dated correction (QCLI-21, following QCLI-12/1dd4aa6) stating the Spec's table now names the full ten-item set directly. Leave the surrounding paragraph and the separate, independently-true "synthesis of six deliverables" statements (lines 19-22, 159) untouched — verified these describe the six *research* deliverables QCLI-2.8 synthesizes, distinct from the ten-item *dependency* list, and remain correct.
   b. Lines ~574-575 (QCLI-16's licensing correction note): repair the missing preposition ("misattribution `QCLI-2.8` settlement" -> "misattribution in `QCLI-2.8` settlement") without touching substance, dating, or attribution.

4. docs/reference/quest-cli-research-source-register.md: not touched (AC10) — read only, to source the QCLI-15 audit text being cited/paraphrased in open-component-decisions.md.

5. Record in Backlog notes: AC5's out-of-repo-transcript search for QCLI-2.12's F4/F5 (grepped local Claude Code session .jsonl transcripts under ~/.claude/projects/-Volumes-external-repos-quest-cli/ for "F4 and F5", "Review follow-up", "left for the orchestrator" alongside QCLI-15's own git fsck / gh api checks) turned up only the same one-line summary already in the repo -- substance not recoverable. Add a --comment flagging this explicitly per the task's own instruction, rather than inventing text.

6. Run lore validate --strict, lore check, lore orphans; fix anything they flag (e.g. anchor slugs) before considering done.

7. Commit in small logical commits (open-component-decisions.md changes; contracts-and-delivery-graph.md changes; docs/log.md sync via lore sync if needed), each with a "Refs: QCLI-21" trailer, then push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented all 11 acceptance criteria against docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md, in three commits (0ce88fd, 50a58af, 0301e5f).

Re-verification performed before editing (no drift found from the task description):
- Line numbers in open-component-decisions.md matched exactly: framing paragraph 204-207, D1 at 92-97, and residual-items rows 214-223 (216 QCLI-2.8 dep-order, 217 F4/F5, 218 backlink, 219 licensing, 220 bin-path, 221 Allowed value).
- All five cited SHAs verified via `git show <sha> --stat`: QCLI-12 1dd4aa6, QCLI-13 d871d32, QCLI-14 077d3be, QCLI-15 6b78fd0, QCLI-16 44a7ed8 all resolve to the exact commits the task description names.
- Confirmed QCLI-12 fixed the Spec's Dependency order table at docs/specs/quest-cli-pre-implementation-research-program.md:68 (now lists all ten items) and added its own dated correction note at :72-79.
- Confirmed QCLI-13's fix locations: docs/reference/quest-cli-component-charter.md:28 (Owns-here bullet -> playbook link) and docs/reference/former-ocli-to-qcli-migration-ledger.md:123 (Added 2026-08-05 by QCLI-13 note).
- Confirmed QCLI-14's fix location: docs/reference/quest-cli-packaging-contract.md:80-81 (new Bin column + dated correction note).
- Read QCLI-15's full audit text in quest-cli-research-source-register.md (not edited; AC10 honored) at the Traceability-audit note (~1064-1090) and the Finding A/B note (~1227-1274) to source the Consequence/closure-condition text used in the register rows.

AC-by-AC:
- AC1: framing paragraph and heading rewritten (heading "Residual items recorded but never filed" -> "Residual items recorded in settlement notes", following this repo's own precedent for rewriting a falsified heading, e.g. QCLI-17's "not fired" rewrite of the version-pin section) to enumerate which of the ten items are closed/audited-open/still-unfiled, each cited; trailing dated correction blockquote (QCLI-21) quotes the old false claim.
- AC2: rows for QCLI-2.8 dependency-order, playbook backlink, and bin-path all marked "Closed by `TASK` (`sha`)" with the file+location the fix now lives at, nothing deleted.
- AC3: licensing row re-scoped (not struck): records QCLI-16 closed the contracts-graph instance and that the D1 instance survived until this same task (QCLI-21) closed it too -- both citations kept, row marked "now closed (was half-closed)" since AC4 lands in this same task/commit set.
- AC4: D1 corrected inline/dated (QCLI-21): Backlog.md's MIT license is not naming-conflict/allocation evidence -- only discussed under "Backlog.md implementation source and internal tests" (Excluded, authorship-independence) and "Backlog.md public surface" (Allowed, ordinary-user-activity) slices; npm registry metadata attribution stands as originally correct. D1's Open status/Product-owner owner left untouched.
- AC5/AC6: F4/F5 row's Source now cites QCLI-15's audit, Consequence states the audited finding (substance never recorded anywhere retrievable) plus the closure condition (recover original reviewer text from an out-of-repo transcript, if findable) and the disambiguation note (two independent F-schemes; wave-4 integration review's F4, PR #17/c8dfdca, is a different item). Allowed-value row's Source/Consequence updated the same way, closure condition = explicit owner ruling ratifying self-classification-by-vocabulary. Both rows remain marked open.
- AC7: component-contracts-and-delivery-graph.md's "names only the six deliverables ... not in the Spec's table" sentence corrected inline/dated (QCLI-21, following QCLI-12/1dd4aa6): the Spec's table now names all ten directly. Verified the document's separate "synthesis of six deliverables" statements (lines 19-22, 159) describe the six *research* deliverables QCLI-2.8 synthesizes -- a different, independently true claim from the ten-item *dependency* list -- and left those alone.
- AC8: repaired the missing preposition in QCLI-16's licensing correction note ("misattribution `QCLI-2.8` settlement" -> "misattribution in `QCLI-2.8` settlement"), no other change to that note.
- AC9: verified rows for the platform matrix, quest-doc actor model, browser HTTP endpoint, and LCLI-316 against current D3/D6 status in this same file (both still Open/unowned and Routed/unwritten respectively) -- no wave-1 task touched any of the four; left unchanged.
- AC10: docs/reference/quest-cli-research-source-register.md was read only, never edited (confirmed via `git diff --stat`, not present in any of the three commits).
- AC11: gates re-run clean after all edits and after `lore sync` (needed once, to reconcile the story's managed task-status block after moving QCLI-21 to In Progress):
  - `lore validate --strict` -> 38 files, 0 errors, 0 warnings, 6 skipped
  - `lore check` -> 38 files, 0 errors, 0 warnings
  - `lore orphans` -> 0 orphan tasks, 0 dangling links

Out-of-scope finding (reported, not acted on): while reading component-contracts-and-delivery-graph.md's Provenance section (~lines 69-96), found this file's own scope note: three of its cited sources (QCLI-2.5's migration fidelity contract, QCLI-2.6's threat model, and the campaign Story) were not enumerated in the research source register's "Prior QCLI research records" admissibility slice -- but that section itself states this was "Resolved 2026-08-04" by QCLI-6/QCLI-7. No remaining gap found; noted here only for completeness since it was adjacent to text I was reading, not because anything is still open.

AC5 out-of-repo transcript recovery for QCLI-2.12's F4/F5 (see --comment): NOT recoverable. Searched every local Claude Code session transcript for this project (~/.claude/projects/-Volumes-external-repos-quest-cli/*.jsonl, ~30 files) for "F4 and F5", "Review follow-up", and "left for the orchestrator" -- every hit is either the same one-line register/task-notes summary already in the repo, or QCLI-2.12's own settlement-note text verbatim ("F4/F5 (non-blocking, out of scope for this fix pass) -- not touched; left for the orchestrator to track."), never the original reviewer's actual F4/F5 finding text. This matches QCLI-15's own audit conclusion (git log/fsck and gh api pulls/14 reviews+comments all came up empty). No invented text was used; the register row's Consequence cell states the closure condition (recovering the text from an out-of-repo artifact, if one still exists) instead of asserting recovery.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @claude
created: 2026-08-05 15:38
---
AC5 flag for reviewer: the out-of-repo transcript recovery for QCLI-2.12's F4/F5 was attempted and did not succeed. I searched every local Claude Code session transcript for this project under ~/.claude/projects/-Volumes-external-repos-quest-cli/*.jsonl for the F4/F5 discussion; every match is either the same one-line register summary already in the repo or QCLI-2.12's own settlement-note sentence verbatim ("F4/F5 (non-blocking, out of scope for this fix pass) -- not touched; left for the orchestrator to track."). None of them record what F4 or F5 actually asserted. This is consistent with QCLI-15's own audit, which also came up empty via git log/git fsck and gh api pulls/14 reviews+comments. I did not invent replacement text; the register row instead states the closure condition (recovering the text from an out-of-repo artifact, if one still exists) as QCLI-15's audit itself concluded. If a reviewer has access to a transcript this session did not search (e.g. a different machine's local session history, or the original interactive session that produced QCLI-2.12), that would be the next place to look.
---
<!-- COMMENTS:END -->
