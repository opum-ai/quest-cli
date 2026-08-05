---
id: QCLI-22
title: >-
  Re-pin the research source register's member pins invalidated by the
  QCLI-12..17 wave
status: Done
assignee:
  - '@jeremy'
created_date: '2026-08-05 14:37'
updated_date: '2026-08-05 16:28'
labels:
  - campaign
  - 'cluster:provenance'
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-2
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The register's "Prior QCLI research records" slice pins fourteen member documents -- eleven by exact commit SHA, three by self-pin. Wave 1 amended four of those members. Because the wave routed all register edits to a single task (QCLI-15) to avoid a parallel-edit collision, QCLI-12, QCLI-13, QCLI-14, and QCLI-16 each recorded their pin impact as a follow-up rather than acting on it. Re-verified on merged `dev` (`git log --format='%h %cI' -1 -- <path>`, cross-checked with `git show -s --format=%cI` and `git show --stat`, the register's own documented method): all four are still outstanding; nothing in the wave incidentally fixed them.

Three exact-SHA pins are stale:

- Component charter, register lines 924-929, pinned `942da73` -> actually `d871d32` (QCLI-13, PR #26).
- Research Spec, register lines 953-956, pinned `157ad56` -> actually `1dd4aa6` (QCLI-12, PR #25).
- Packaging contract, register lines 991-994, pinned `3b5cd8c` -> actually `077d3be` (QCLI-14, PR #27).

Each shares its SHA with a sibling member whose pin is still correct, so each must be decoupled, not repointed wholesale: `942da73` still correctly pins the ADR (unamended by the wave), `157ad56` still correctly pins the Lore dependency evidence doc (register lines 968-970), and `3b5cd8c` still correctly pins the legacy Opum reconciliation (register lines 956-958).

Three self-pins carry a "read live 2026-08-04" retrieval stamp on documents amended 2026-08-05: the migration ledger (register lines 947-952, amended by `d871d32`), the register itself (register lines 1005-1010, amended by `6b78fd0`), and QCLI-2.8's contracts and delivery graph (register lines 1018-1022, amended by `44a7ed8`). These do not break -- QCLI-16 verified the self-pin mechanism held -- but whether the stamp is refreshed is a register-owner call this task should settle explicitly rather than leave implicit.

Line numbers above are as observed by the wave-1 integration review immediately after merge; re-verify current line numbers before editing, since intervening commits may have shifted them slightly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The component charter's pin is decoupled from the ADR's and repointed to d871d32 (or converted to a self-pin, if the task judges that more durable given the charter is now amended by ongoing follow-through work). The ADR keeps 942da73, independently re-verified as still that file's last-touching commit
- [x] #2 The research Spec's pin is decoupled from the Lore dependency evidence document's and repointed to 1dd4aa6; the evidence document keeps 157ad56, re-verified
- [x] #3 The packaging contract's pin is decoupled from the legacy Opum reconciliation's and repointed to 077d3be; the reconciliation keeps 3b5cd8c, re-verified
- [x] #4 Every new SHA is verified with the register's own documented method -- git log --format=%h-%cI -1 -- path, cross-checked against git show -s --format=%cI SHA and git show --stat SHA -- and the verification is recorded in the pin text the same way the existing pins record theirs
- [x] #5 The three self-pins "read live 2026-08-04" retrieval stamps are explicitly dispositioned: either refreshed to 2026-08-05 with the amending task and commit named, or left with a stated reason why the stamp is not a freshness claim. Not left silently unaddressed
- [x] #6 All derived summary prose is updated in the same pass: the distinct-SHA enumeration, the total-count sentence, and the running self-pinned/commit-pinned counts elsewhere in the same register slice. If all three stale pins are repinned rather than converted to self-pins, the distinct-SHA count goes from 8 to 11 and 942da73, 157ad56, and 3b5cd8c each drop to pinning one member
- [x] #7 The eight pins verified still correct (the ADR at 942da73, the legacy Opum reconciliation at 3b5cd8c, the black-box acceptance scenarios document at 883b445, the component glossary at 63b1e0a, the Lore dependency evidence document at 157ad56, the migration fidelity contract at 418c5eb, the threat model at 739aa7e, the adoption playbook at 1a61989) are re-verified and left unchanged
- [x] #8 All changes are inline, dated, and cite this task, following the register's own QCLI-6/QCLI-7/QCLI-9 correction precedent. No Classification value changes and no permitted use is narrowed
- [x] #9 The wording tension between the register's Notes section describing this audit as closing two residual findings and the same section elsewhere stating they remain open is reconciled so the audit's own conclusion is stated consistently
- [x] #10 The task self-pins the register in the same pass if its own edit invalidates the register's own self-pin retrieval stamp, per the standing pin-handling criterion this campaign's tasks have carried since wave 1
- [x] #11 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verified every cited line number and SHA against merged dev (this branch's HEAD equals origin/dev) using the registers own documented method (git log --format=%h %cI -1 -- path, cross-checked with git show -s --format=%cI SHA and git show --stat SHA). Confirmed all task claims exactly: component charter now d871d32 (QCLI-13, PR #26), research Spec now 1dd4aa6 (QCLI-12, PR #25), packaging contract now 077d3be (QCLI-14, PR #27); ADR (942da73), Lore dependency evidence doc (157ad56), and legacy Opum reconciliation (3b5cd8c) each independently re-verified unchanged. Also re-verified the other five stable pins (883b445, 63b1e0a, 418c5eb, 739aa7e, 1a61989) all unchanged, and the three self-pinned documents (migration ledger, register itself, QCLI-2.8 contracts and delivery graph) each amended since their 2026-08-04 read-live stamp by d871d32/6b78fd0/44a7ed8 respectively. Cited line numbers in the task (924-929, 947-952, 953-956, 991-994, 1005-1010, 1018-1022) all matched current file content exactly, no drift to correct.

2. Edit only docs/reference/quest-cli-research-source-register.md via a plain editor (this is prose-only content inside an existing Reference; lore does not mediate line-level prose edits, only frontmatter/managed blocks/linking), following the same inline dated-annotation style as the existing QCLI-6/QCLI-7/QCLI-9 corrections already in this exact paragraph:
   - Append one new dated, cited correction block (Corrected 2026-08-05 by QCLI-22) that: decouples and repins the component charter (942da73 -> d871d32, ADR keeps 942da73), the research Spec (157ad56 -> 1dd4aa6, Lore dependency evidence doc keeps 157ad56), and the packaging contract (3b5cd8c -> 077d3be, legacy Opum reconciliation keeps 3b5cd8c), each recording the git verification method inline; states and justifies the judgment call to repoint the charter as a commit-pin rather than convert it to a self-pin (not co-edited by this task's own pass, the register's sole standing self-pin-eligibility test); updates the distinct-SHA enumeration (8 -> 11) and running self-pinned/commit-pinned counts (3 self-pinned / 11 commit-pinned, unchanged); restates the eight pins verified unchanged.
   - Append a second dated block (Self-pin retrieval-date disposition, 2026-08-05, QCLI-22) explicitly dispositioning the three "read live 2026-08-04" stamps (migration ledger, this register, QCLI-2.8 document): refreshes each to 2026-08-05, names the amending task/commit for each, and states why the self-pin mechanism was never broken (QCLI-16 already verified this) while still refreshing the date for reader clarity.
   - Fix the Notes section wording tension (AC9): reword the QCLI-15 audit summary sentence ("closed two residual findings") which contradicts the same section's own conclusion that both Finding A (needs an owner ruling) and Finding B (F4/F5 substance unrecoverable) remain open; add an inline dated correction (2026-08-05, QCLI-22) clarifying QCLI-15 closed the investigation into each finding, not the findings themselves, matching the paragraphs own stated conclusions below it.
   - Confirm AC10 explicitly in the same new text: this tasks own edit further amends the register, which is already covered by the registers existing self-pin mechanism (no separate action needed structurally), stated explicitly rather than left implicit.
   - Update the document's own frontmatter timestamp and summary line to reflect this pass, consistent with how prior correction tasks (QCLI-6/7/9) touched this file's frontmatter.

3. Run lore check, lore validate --strict, and lore orphans; fix any reported issue before considering done.

4. Record verification evidence and out-of-scope findings (none anticipated beyond the AC1/AC5 judgment calls) in --append-notes; leave AC1 (charter self-pin-vs-repoint) and AC5 (stamp refresh-vs-leave) noted as judgment calls for reviewer confirmation via --comment.

5. Commit in small logical commits (pin corrections; self-pin stamp disposition; Notes wording fix, if not folded together) each with a docs(register): summary and a Refs: QCLI-22 trailer, then push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Re-verified every cited line number and SHA against merged dev (this branch's HEAD equals origin/dev's tip, bb70619) using the register's own documented method: git log --format=%h %cI -1 -- path for each path, cross-checked with git show -s --format=%cI SHA and git show --stat SHA. Every claim in the task description matched exactly, with no line-number drift:

- Component charter: now d871d32 (2026-08-05T08:28:56-05:00, QCLI-13, PR #26) - confirmed via git show --stat d871d32 touching docs/reference/quest-cli-component-charter.md (and former-ocli-to-qcli-migration-ledger.md in the same commit).
- Research Spec: now 1dd4aa6 (2026-08-05T08:24:52-05:00, QCLI-12, PR #25) - confirmed via git show --stat 1dd4aa6 touching docs/specs/quest-cli-pre-implementation-research-program.md.
- Packaging contract: now 077d3be (2026-08-05T08:41:47-05:00, QCLI-14, PR #27) - confirmed via git show --stat 077d3be touching docs/reference/quest-cli-packaging-contract.md.
- ADR (942da73), Lore dependency and adapter contract evidence document (157ad56), and legacy Opum requirement reconciliation (3b5cd8c) each independently re-verified unchanged/unamended by the wave.
- The other five stable pins re-verified unchanged: black-box acceptance scenarios (883b445), component glossary (63b1e0a), migration fidelity contract (418c5eb), threat model (739aa7e), adoption playbook (1a61989).
- The three self-pinned documents (migration ledger, this register, QCLI-2.8's component contracts and delivery graph) each confirmed amended since their "read live 2026-08-04" stamp: by d871d32 (2026-08-05), 6b78fd0 (2026-08-05, QCLI-15), and 44a7ed8 (2026-08-05, QCLI-16) respectively.

Edits made to docs/reference/quest-cli-research-source-register.md only (two commits):

1. Appended a dated, cited correction block (Corrected 2026-08-05 by QCLI-22) in the "Prior QCLI research records" slice's Exact revision or retrieval date field, following the existing QCLI-6/QCLI-7/QCLI-9 precedent already in that same paragraph: decouples and repoints the component charter (942da73 -> d871d32; ADR keeps 942da73), the research Spec (157ad56 -> 1dd4aa6; Lore dependency evidence document keeps 157ad56), and the packaging contract (3b5cd8c -> 077d3be; legacy Opum reconciliation keeps 3b5cd8c), each with the verification recorded inline in the same style as existing pins. Updates the distinct-SHA enumeration from eight to eleven and restates the eight unchanged pins. States and justifies the judgment call to repoint the charter as an exact-commit SHA pin rather than convert it to a self-pin (flagged below for reviewer confirmation).
2. In the same block, added a "Self-pin retrieval-date disposition, 2026-08-05, QCLI-22" paragraph explicitly dispositioning the three self-pins' "read live 2026-08-04" stamps: refreshed all three to 2026-08-05, naming the amending task/commit for each, with an explicit statement that the self-pin mechanism itself was never broken (per QCLI-16's own prior verification) - the refresh is for reader clarity, not because the pin failed. Also explicitly confirms AC10: this task's own edit to the register is already covered by the register's existing self-pin mechanism ("as amended live through this same edit or through any later commit in this same pass"), stated explicitly rather than left implicit.
3. Separately, reconciled the Notes section's wording tension (AC9): the summary sentence claiming QCLI-15's audit "closed two residual findings" contradicted the same section's own conclusion that both Finding A (needs an explicit owner ruling) and Finding B (F4/F5 substance unrecoverable) remain open. Reworded to state the audit closed the investigation into each finding, not the findings themselves, and added a short inline note to the Finding A paragraph pointing out the gap remains open (Finding B's own paragraph already stated "remain open" explicitly, so no change was needed there beyond the summary-sentence fix).

No Classification value changed and no permitted use narrowed anywhere in this pass.

Verification gate evidence (run after all edits, from a clean working tree):
- lore sync: reconciled a pre-existing status/managed-block drift caused by this task's own "In Progress" status change (docs/log.md, the owning Story's managed Tasks block) - unrelated to the register content edits, expected side effect of picking up the task.
- lore validate --strict: 38 files, 0 errors, 0 warnings, 6 skipped. Exit 0.
- lore check: 38 files, 0 errors, 0 warnings. Exit 0.
- lore orphans: 0 orphan tasks, 0 dangling links. Exit 0.

Commits (branch fix/qcli-22-register-repin):
- 09cd94c docs: sync log.md and story after QCLI-22 status pickup
- 01a79b8 docs(register): re-pin three members invalidated by the QCLI-12/13/14 wave
- 6b941a3 docs(register): reconcile Notes wording tension on QCLI-15's audit conclusion

Out-of-scope findings: none beyond the two judgment calls already flagged inline in the register text and repeated below for the reviewer's attention. Did not touch quest-cli-open-component-decisions.md or quest-cli-component-contracts-and-delivery-graph.md (QCLI-21's scope), and did not touch any QCLI-11/18/19/20 proposal documents.

Fix pass applied after reviewer's request_changes (two narrow findings; all 14 SHA re-pins, the arithmetic, and both judgment calls were independently re-verified and confirmed correct by the reviewer and left untouched):

1. Finding 1 (unattributed inline prose amendment, register lines ~1348-1350, Finding A paragraph): attributed the added clause with an inline dated citation, matching the register's own convention. Changed "the gap itself remains open pending the explicit owner ruling that paragraph describes." to "**added 2026-08-05 by `QCLI-22`:** the gap itself remains open pending the explicit owner ruling that paragraph describes."

2. Finding 2 (unresolved "flagged for reviewer confirmation" marker, register lines ~1103-1111, component-charter repoint-vs-self-pin decision): replaced the open flag with the resolved record the reviewer supplied. Changed "**Flagged for reviewer confirmation** -- this is a judgment call, not a mechanical application of the existing rule." to "**Confirmed on review 2026-08-05:** this follows `QCLI-9`'s own precedent above directly -- a member invalidated by another task's merge and not co-edited by the correcting pass is repinned by exact-commit SHA -- and the register's own reasoning under Exclusions (a self-pin protects only against edits made by this task's own passes, not later tasks') is why a self-pin would not have made the charter's pin more durable." Cross-checked against the QCLI-9 block above (register lines ~1030-1046) and the Exclusions-field self-pin rationale (register lines ~1239-1240): both confirm the precedent and reasoning cited.

No SHA re-derived or changed. Only docs/reference/quest-cli-research-source-register.md touched; diff confirmed to contain exactly these two hunks, nothing else.

Gate re-verification after the fix (clean working tree):
- lore validate --strict: 38 files, 0 errors, 0 warnings, 6 skipped. Exit 0.
- lore check: 38 files, 0 errors, 0 warnings. Exit 0.
- lore orphans: 0 orphan tasks, 0 dangling links. Exit 0.

Scope re-check: git diff --stat bb70619922dff171f479e68fa7de949b03d4b3a1...HEAD -- docs/reference/quest-cli-open-component-decisions.md docs/reference/quest-cli-component-contracts-and-delivery-graph.md is empty -- QCLI-21's territory remains untouched.

Addendum fix pass (2026-08-05), cross-task finding from QCLI-21's review:

QCLI-21's reviewer, working this same wave on quest-cli-open-component-decisions.md, recovered the original QCLI-2.12 F4/F5 reviewer text from an out-of-repo Claude Code session transcript (~/.claude/projects/-Volumes-external-repos-quest-cli/a6226b48-8acf-4fd0-beb5-18c099fc4540.jsonl, line 224, uuid ab85399e-c963-48a0-b029-315e23081241, timestamp 2026-08-04T17:05:34.273Z; a second copy exists at .../d92cd86b-56f8-47fc-87e7-fe0fbe46cd6d.jsonl). This falsifies the register's Notes-section claim (Finding B, the paragraph ending "...so no one can now judge whether they still apply to the current register text") that no retrievable record of F4/F5's substance exists.

Independently verified both transcript copies before use: confirmed the uuid, timestamp, and full F4/F5 text (0-indexed line 224 = 1-indexed line 225 via grep -n, an indexing-convention difference, not a discrepancy) match exactly what was cited. Did not take the finding on trust.

Fix applied: appended one new inline, dated correction block ("Corrected 2026-08-05 by QCLI-22") directly after the existing Finding B paragraph in docs/reference/quest-cli-research-source-register.md's Notes section. It attributes the recovery accurately to QCLI-21's review pass (not authored by QCLI-22), cites the transcript path/uuid/timestamp, briefly summarizes F4 and F5's substance, points to quest-cli-open-component-decisions.md's own F4/F5 row (updated by QCLI-21 in parallel) for full detail, and corrects the "no one can now judge whether they still apply" framing without overclaiming resolution -- whether F4/F5 still apply to the register's current text is left as a separate, still-open question.

No SHA touched, no Classification value changed, no other part of the register edited. This is additive-only: one new paragraph, nothing removed or reworded elsewhere.

Gate re-verification after this addendum (clean working tree):
- lore validate --strict: 38 files, 0 errors, 0 warnings, 6 skipped. Exit 0.
- lore check: 38 files, 0 errors, 0 warnings. Exit 0.
- lore orphans: 0 orphan tasks, 0 dangling links. Exit 0.

Scope re-check: git diff --stat bb70619922dff171f479e68fa7de949b03d4b3a1...HEAD -- docs/reference/quest-cli-open-component-decisions.md docs/reference/quest-cli-component-contracts-and-delivery-graph.md is empty -- QCLI-21's territory remains untouched.

Verified: Reviewer independently re-derived all 14 member pins from git log/show against merged dev with zero discrepancies, and independently re-verified the arithmetic (8 to 11 distinct SHAs). Both flagged judgment calls (charter repoint-vs-self-pin, self-pin stamp refresh) were ruled correct by the reviewer as mechanical applications of the register's own standing rule, not discretionary calls needing human input. First pass found two narrow convention issues (an unattributed prose clause, an open reviewer-confirmation flag); both fixed, plus one addendum recording that QCLI-21's reviewer recovered the F4/F5 text this register previously called unrecoverable (independently verified against the transcript files a second time). lore validate --strict / lore check / lore orphans all clean (38 files, 0/0). Merged as 2fd6c13 (PR #36).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @claude
created: 2026-08-05 15:36
---
Two judgment calls need reviewer sign-off:

1. AC1 (charter self-pin vs repoint): repointed the component charter to an exact-commit SHA pin (d871d32) rather than converting it to a self-pin. Reasoning: the register's own standing rule ties self-pin eligibility strictly to "co-edited by this same task's own pass" (established for the migration ledger, this register, and QCLI-2.8's document), not to how often other tasks amend a document over time. QCLI-22 does not co-edit the component charter in this pass, so it does not qualify under the existing test even though the charter is being repeatedly amended by ongoing follow-through work. Flagged inline in the register text itself for visibility. If a reviewer judges the charter's amendment cadence during this campaign is high enough to warrant relaxing the self-pin-eligibility rule (or converting the charter specifically), that is a rule change beyond what this task's own scope authorizes me to make unilaterally.

2. AC5 (self-pin stamp disposition): refreshed all three "read live 2026-08-04" stamps to 2026-08-05, naming each amending task/commit, while also stating explicitly that the self-pin mechanism was never broken (a self-pin resolves to current content whenever read, regardless of the stamp date) - so the refresh is presented as a reader-clarity improvement, not a correction to a defect. Please confirm this framing is the intended disposition rather than, e.g., leaving the stamps at 2026-08-04 with a note that the date is not a freshness claim.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-verified all 14 member pins in docs/reference/quest-cli-research-source-register.md against merged dev and corrected the three stale exact-SHA pins the QCLI-12/13/14 wave invalidated, decoupling each from the sibling that still correctly shares the old SHA. Explicitly dispositioned the three self-pins' retrieval stamps, refreshing them with named amending commits. Updated the derived summary counts. Recorded that QCLI-21's reviewer recovered the QCLI-2.12 F4/F5 text this register previously called unrecoverable. Does not touch the open component decisions register or contracts graph (QCLI-21's territory this wave). Merged as 2fd6c13 (PR #36).
<!-- SECTION:FINAL_SUMMARY:END -->
