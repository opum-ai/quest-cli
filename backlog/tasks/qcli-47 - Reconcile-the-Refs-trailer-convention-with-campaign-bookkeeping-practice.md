---
id: QCLI-47
title: Reconcile the Refs trailer convention with campaign bookkeeping practice
status: Done
assignee:
  - '@claude'
created_date: '2026-08-07 18:52'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
references:
  - .claude/skills/backlog-handover/SKILL.md
  - .claude/skills/backlog-handover/reference/wave-loop.md
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
priority: low
type: chore
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The backlog-handover skill's Commits convention (`.claude/skills/backlog-handover/SKILL.md` line 98) reads: "always a `Refs: QCLI-<N>` trailer — except `lore sync`'s own `backlog/` auto-commit ... the one deliberate exception". QCLI-43 carved out that single exception. The doc-10 wave-2 reviewer then found the orchestrator's **own** campaign bookkeeping commits routinely lack the trailer — practice the convention as written does not permit, sitting awkwardly next to a rule that now names exactly one exception. This is pre-existing practice drift, not something QCLI-43 introduced.

Verified 2026-08-07 at doc-11 init — and practice is **inconsistent, not uniformly absent**, which corrects how doc-10 framed this:

- Empty `%(trailers:key=Refs)`: `8721feb`, `146956d`, `9c63769`, `d0b5f41`, `3686859` (init doc-10), `34bceae`, `8caae19`, `748bf5f`, `6047774`.
- Carries `Refs: QCLI-43`: `0b63077`, `342e76d`.

The pattern behind the split: single-task bookkeeping commits (dispatch / in-flight pointer / settle) increasingly do carry the trailer, while campaign-scoped commits (init, close) do not — and those genuinely have no single directing task to name.

**OWNER RULING (2026-08-07, obtained at doc-11 campaign init, before dispatch): hybrid.** Emit `Refs: QCLI-<N>` on bookkeeping commits that have a single directing task — already the de facto practice in `0b63077` and `342e76d` — and document an exception in SKILL.md for genuinely campaign-scoped commits (init, close, gitignore) that have none.

Owner's rationale: it matches what the evidence already shows the orchestrator doing correctly, and preserves the traceability the recent single-task commits provide rather than discarding it to make the rule simpler.

Scope: this is a skill-documentation change. It touches `.claude/skills/backlog-handover/SKILL.md` and any `reference/*.md` file restating the same claim. It does **not** rewrite history — no existing commit is amended or re-trailered.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Commits convention in SKILL.md states the hybrid rule: a `Refs: QCLI-<N>` trailer is required on bookkeeping commits that have a single directing task, and campaign-scoped commits with no single task are a named exception alongside the existing `lore sync` one
- [x] #2 Every place in the skill that restates the commit convention agrees with the recorded rule, verified by grep across SKILL.md and reference/, leaving no claim false
- [x] #3 The orchestrator-facing instructions name which bookkeeping commits fall on each side, concretely enough that a future session emits the right trailer without re-deriving the rule
- [x] #4 The skill version and provenance record reflect this change, in the same form that 0.9.1-qcli.2 used to record the QCLI-43 divergence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SKILL.md Commits convention row (line ~98): rewrite to state the hybrid rule — Refs: QCLI-<N> required on every commit with one directing task (worker/implementation commits; orchestrator bookkeeping commits for a single task: dispatch marking, in-flight pointer recording, settlement); two named exceptions carry no trailer: lore sync's backlog/ auto-commit (QCLI-43, pre-existing) and campaign-scoped bookkeeping commits with no single directing task (init, close, handover archiving, the one-time gitignore setup). Cross-reference reference/wave-loop.md section i for the full breakdown.
2. wave-loop.md section i: insert a new "Commit trailer convention (hybrid rule, QCLI-47)" subsection between the campaign-doc-write paragraph and the "### Lore log sync" subsection, with a concrete table naming each bookkeeping commit type (dispatch marking, in-flight pointer, settle, docs sync commit, campaign init, campaign close, handover archive, gitignore setup, lore sync auto-commit) and whether it carries a trailer, plus the dividing principle (single directing task vs none) with the 342e76d settle+close example.
3. wave-loop.md line ~182 ("### Lore log sync" subsection): fix "the one commit this contract blesses as untrailered" -> "one of this contract's named untrailered exceptions", cross-referencing the new subsection and QCLI-47.
4. SKILL.md I3 (gitignore commit) and R5.1 (handover archive commit): add short parenthetical noting these are the no-trailer campaign-scoped exception, for concreteness at the point of action.
5. SKILL.md frontmatter: bump version 0.9.1-qcli.2 -> 0.9.1-qcli.3.
6. SKILL.md Provenance section: append a new "Deliberate divergence (0.9.1-qcli.3, QCLI-47, 2026-08-07)" paragraph in the same form as the qcli.2 entry, citing the doc-10 wave-2 finding, the doc-11-init verification evidence (empty vs non-empty trailer SHAs), the owner ruling, and that no history is rewritten.
7. Verify: grep -rn 'Refs:' and grep -rn 'trailer' across .claude/skills/backlog-handover/ (SKILL.md + reference/) and confirm every hit agrees with the hybrid rule (AC #2). Run lore check --strict to confirm the docs bundle is undisturbed.
8. Record grep/gate output verbatim in --append-notes. Commit in small logical commits with Refs: QCLI-47 trailer. Push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the hybrid Refs-trailer rule from the owner ruling.

Changes:
- SKILL.md Commits convention row (line 98): now states the hybrid rule explicitly — Refs: QCLI-<N> required on any commit with one directing task (worker/implementation commits; orchestrator bookkeeping: dispatch marking, in-flight pointer recording, settlement); two named no-trailer exceptions: lore sync's backlog/ auto-commit (QCLI-43, pre-existing) and campaign-scoped bookkeeping with no single task (init, close, handover archiving, gitignore setup).
- SKILL.md I3 (gitignore commit) and R5 step 1 (handover archive commit): added parentheticals naming these as the no-trailer campaign-scoped exception, for concreteness at the point of action.
- SKILL.md frontmatter version bumped 0.9.1-qcli.2 -> 0.9.1-qcli.3; new Provenance paragraph added in the same form as the qcli.2 (QCLI-43) entry, citing the doc-10 wave-2 finding, the doc-11-init verification evidence, and the owner ruling. Prior Provenance entries (v0.9.1-qcli.1, v0.9.1-qcli.2) left untouched.
- reference/wave-loop.md: new "Commit trailer convention (hybrid rule, QCLI-47)" subsection inserted in section i, between the campaign-doc-write paragraph and "### Lore log sync" — a concrete table naming every bookkeeping commit type (dispatch marking, in-flight pointer, settle, docs sync commit, campaign init, campaign close, handover archive, gitignore setup, lore sync auto-commit) and whether it carries a trailer, plus the dividing principle (single directing task vs none, with the 342e76d settle+close example) so a future session does not have to re-derive the rule.
- reference/wave-loop.md line ~200 (Lore log sync subsection): fixed "the one commit this contract blesses as untrailered" -> "one of this contract's named untrailered exceptions", since a second exception now exists; cross-referenced the new subsection and QCLI-47.

No history rewritten; no existing commit amended or re-trailered, consistent with the task's explicit scope limit.

AC #2 grep sweep (verbatim):

$ grep -rn 'Refs:' .claude/skills/backlog-handover/
SKILL.md:98 (Commits row, hybrid rule) — agrees
SKILL.md:161 (R5 handover-archive parenthetical) — agrees
SKILL.md:203 (new Provenance qcli.3 paragraph) — agrees
reference/wave-loop.md:90 (worker Commit step, single-task, unchanged) — agrees
reference/wave-loop.md:169,173-176 (new Commit trailer convention subsection) — agrees
reference/wave-loop.md:205 (docs sync commit, per-task trailers, unchanged) — agrees

$ grep -rn 'trailer' .claude/skills/backlog-handover/
Same site set plus SKILL.md:98, SKILL.md:134 (I3 gitignore parenthetical), reference/wave-loop.md:167-183 (new subsection incl. table rows), reference/wave-loop.md:200 (lore-sync exception, corrected wording) — every hit agrees with the hybrid rule; no false claim found or left standing.

9 restatement sites total (up from 4 pre-change: SKILL.md:98, wave-loop.md:90, wave-loop.md:182, wave-loop.md:187); 2 of the original 4 changed (SKILL.md:98, wave-loop.md:182 old numbering), 2 already consistent and left as-is (wave-loop.md:90 worker commit, wave-loop.md:187 docs-sync-commit trailers), 5 new sites added (SKILL.md:134, SKILL.md:161, SKILL.md Provenance, wave-loop.md new subsection intro + table).

Gate: lore check --strict -> "47 files, 0 errors, 0 warnings" (unchanged from baseline — .claude/ is outside the lore bundle, confirming this change did not disturb docs/).

Out-of-scope discoveries: none. wave-loop.md section d/i do not currently spell out an explicit "git commit" instruction for dispatch-marking or in-flight-pointer recording (backlog task edit alone, with auto_commit: false, leaves the tree dirty) — the new Commit trailer convention table documents the trailer expected of those commits without inventing new "when to commit" mechanics, since that gap (if it is one) is outside QCLI-47's scope of reconciling the trailer convention.

SETTLEMENT (orchestrator, on dev). Review was run by the orchestrator as an explicit adversarial pass in the skill's degraded mode: dispatched reviewer subagents terminated without delivering a verdict, so the mandatory gate was re-run in-session rather than skipped.

Independently verified, not taken from the implementer:
- AC#1: SKILL.md's Commits row states the hybrid rule and names both exceptions.
- AC#2: own sweep, not a replay of the worker's — 'grep -rniE "the one deliberate exception|the only exception|always a .?Refs"' plus a full Refs:/trailer enumeration across SKILL.md and reference/. ZERO surviving absolutist claims. wave-loop.md's 'the one commit this contract blesses as untrailered' was correctly rewritten. The two sites left unchanged (worker commits; docs-sync commits) are correct as-is — both have a directing task, so the trailer requirement still holds there. The Provenance paragraph's 'always a trailer except lore sync's' is past-tense description of the superseded rule, not a live claim.
- AC#3: the new wave-loop.md table resolves all six probe cases unambiguously (dispatch marking, in-flight pointer, settle, campaign init, campaign close, handover archive, I3 gitignore).
- AC#4: frontmatter bumped to 0.9.1-qcli.3; new Provenance paragraph matches the qcli.2 form; prior qcli.1/qcli.2 entries NOT rewritten (no deletion lines in that range).

Reviewer finding [major, fixed at merge]: the branch commit's 'Refs: QCLI-47' sat in its own paragraph, separated by a blank line from the trailing Co-Authored-By block, so 'git interpret-trailers --parse' did not see it — self-refuting for this task, whose own evidence uses %(trailers:key=Refs) as the measurement. Fixed by authoring the squash message with a correctly-placed trailer; verified parseable on dev after merge. NOT unique to this branch: the QCLI-43 squash-merge (7efc1a4) lost its trailer the same way, so the squash-merge path is a systemic trailer-loss vector. Surfaced to the owner as a proposed follow-up.

Merged as 694e109 (PR #61), rebased onto 866b184 and re-verified before merge.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the backlog-handover skill's single-exception commit rule with the owner's hybrid rule: a 'Refs: QCLI-<N>' trailer is required wherever a commit has one directing task (worker commits, dispatch marking, in-flight pointer recording, settlement), while genuinely campaign-scoped commits with no single task — campaign init, close, handover archiving, the one-time gitignore setup — join lore sync's auto-commit as a second named exception. Added a per-commit-type breakdown table to reference/wave-loop.md section i resolving every bookkeeping commit type, corrected the now-false 'the one commit this contract blesses as untrailered' claim, and bumped the skill to 0.9.1-qcli.3 with a Provenance entry matching the qcli.2 form. Documentation-only: no commit history rewritten or re-trailered. Verified by an independent grep sweep finding zero surviving absolutist claims, and lore check --strict at 0 errors/0 warnings. Merged as 694e109.
<!-- SECTION:FINAL_SUMMARY:END -->
