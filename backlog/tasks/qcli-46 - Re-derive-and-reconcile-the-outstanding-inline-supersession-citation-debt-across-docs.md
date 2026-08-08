---
id: QCLI-46
title: >-
  Re-derive and reconcile the outstanding inline supersession-citation debt
  across docs
status: In Progress
assignee: []
created_date: '2026-08-07 18:52'
updated_date: '2026-08-08 01:19'
labels:
  - campaign
  - 'cluster:supersession-convention'
  - wave-2
dependencies:
  - QCLI-45
references:
  - CLAUDE.md
  - docs/reference/quest-cli-research-source-register.md
  - docs/reference/quest-cli-backlog-migration-fidelity-contract.md
  - docs/reference/quest-cli-activation-gate-evidence-record.md
priority: medium
type: docs
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CLAUDE.md's QCLI-44 ruling (2026-08-07) requires every inline supersession amendment in `docs/` to cite the Backlog task under which it was made, not only the closing decision it names. QCLI-44 brought several sites into conformance and left the remainder as recorded, unreconciled debt. This task closes that debt.

**The outstanding set must be RE-DERIVED, not inherited from any existing count.** Both prior records are demonstrably wrong, in different directions, and neither can be trusted as a starting inventory:

- QCLI-44's implementation notes open with a first-pass estimate of "~30+ uniformly non-conformant" sites across the 2026-08-04..06 reconciliation era, then carry a fix-pass correction establishing that inline self-citation was already the norm in that era and the real gap is **1 site** (`quest-cli-research-source-register.md:420`). The notes are append-only, so both figures are still present and only the later one is current.
- Verified 2026-08-07 at doc-11 init: `docs/reference/quest-cli-backlog-migration-fidelity-contract.md:561` — the marker "**Review-round fix (2026-08-04).**" — carries no `QCLI-` task id anywhere within ±50 lines and is non-conformant, yet QCLI-44's final inventory does not list that file at all. So the corrected "1 site" figure is **also** wrong. Two independent sweeps have now each missed a site the other found.

Known non-conformant sites as of 2026-08-07 — treat this as a floor, not the set:

1. `docs/reference/quest-cli-research-source-register.md:420` — "**amended 2026-08-04 by the owner's split rule**", no task id at the marker. The split-rule section below (~line 455) separately names QCLI-2.7, so a document-only reader can eventually trace it by following the "see ... immediately below" pointer, but the amendment marker itself does not carry the citation the ruling requires.
2. `docs/reference/quest-cli-backlog-migration-fidelity-contract.md:561` — "**Review-round fix (2026-08-04).**", no task id nearby. Missed entirely by QCLI-44's sweep.
3. `docs/reference/quest-cli-activation-gate-evidence-record.md:67` — the amendment made by commit `a4ae6c5`, which carries **no task at all**: no trailer on the commit, and no task file in `backlog/` references it. QCLI-44 confirmed this by exhausting the task store and recorded it in the document itself as explicitly uncitable debt. **This one needs an owner disposition on what to cite when the authoring work has no directing task — surface it, do not invent or infer a citation.**

Sequencing: this task is dependent on the evidence-record amendment ruling task. That ruling governs how `quest-cli-activation-gate-evidence-record.md` may be amended, and this task touches the same file — running them concurrently would race both the file and the convention.
**OWNER RULING (2026-08-07, obtained at doc-11 wave-1 report, before this task is dispatched) — site 3 (`a4ae6c5`): record it as explicitly uncitable.** Do not invent a citation, do not infer one, and do not file a retroactive task to manufacture one.

Add a dated note at that amendment stating that no directing task exists for it — the authoring work was never filed as a Backlog task — and that this was established by exhausting the task store (`QCLI-44` first, re-confirmed by this task's own sweep). Cite `QCLI-46` as the task that *recorded the gap*, explicitly not as the amendment's author. The distinction must be legible in the text: a reader has to be able to tell that `QCLI-46` is the recorder, not the originator.

Owner's rationale: the citation rule exists so a reader can reach the reasoning behind an amendment. Where no such reasoning was ever recorded, an honest note saying so serves that purpose better than a citation pointing somewhere that does not explain the change. This formalizes what `QCLI-44` already noted informally as unreconciled debt rather than resolving it by fiat.

This ruling settles AC #4 — it *is* the recorded owner disposition. AC #4 is satisfied by implementing this faithfully, not by seeking a further decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The outstanding set is re-derived by an independent sweep of every file under docs/, with the sweep methodology and a per-file result recorded, rather than inherited from the counts in QCLI-44 notes
- [ ] #2 Every non-conformant inline supersession amendment the sweep finds either cites its directing task inline, or appears in a written exception list with a stated reason
- [ ] #3 Each of the three sites named in the description is accounted for by name in the result, including the two that QCLI-44 final inventory missed
- [ ] #4 The commit `a4ae6c5` citation gap carries a recorded owner disposition rather than an invented or inferred citation
- [ ] #5 No historical-record text is rewritten: `git diff` shows every edit as an inline dated addition citing this task
- [ ] #6 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, with the output recorded verbatim in implementation notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Independent sweep of every file under docs/ (44 files) for inline supersession-amendment markers, using three complementary passes so no single pattern's blind spot stands alone: (a) grep for bold-run markers containing either a YYYY-MM-DD date or an amendment-verb (amend/supersed/Ruling/Review-round/fix (/correction/Note (/Updated (/Fix pass/owner ruling) -- 72 hits; (b) for every docs/ file NOT among those 72 hits, a plain date-only grep to confirm no non-bold dated amendment marker exists outside the bold-marker pattern; (c) a broader keyword grep (erratum/retract/walked back/reversed/addendum/editorial note/etc.) plus a strikethrough (~~) scan across all of docs/ to catch non-conventional amendment phrasing. Every one of the 72 bold-marker hits is read in full surrounding context (not just the matched line) and classified conformant/non-conformant against QCLI-44's rule: does the amendment's own marker or its immediate paragraph name a QCLI-task id, without requiring navigation to a separate section via a "see ... below" pointer (the exact defect QCLI-44's register:420 miss exhibits)?
2. For each candidate found non-conformant by the marker text alone, use `git blame`/`git log --follow` on the surrounding lines to independently establish which task's commit actually authored the amendment, rather than guessing or reusing QCLI-44's or the task description's attributions uncritically.
3. Record the full per-file sweep result (all 44 files, conformant count vs non-conformant sites) in the task's implementation notes before editing anything.
4. For each of the 3 non-conformant sites confirmed by the sweep (register.md:420, fidelity-contract.md:561, activation-gate-evidence-record.md:67/74-79 - the a4ae6c5 gap), add ONLY an inline, dated, appended addition citing QCLI-46 -- no deletion or re-wording of any existing sentence:
   - register.md:420 -- add a dated note citing QCLI-46 as recorder and QCLI-2.7 as the directing task (git blame commit `2246c46` shows QCLI-2.7 authored both the amended Exclusions bullet and the split-rule section it points to).
   - fidelity-contract.md:561 -- add a dated note citing QCLI-46 as recorder and QCLI-2.5 as the directing task (git blame/commit title on `407ea61` shows the "Review-round fix" paragraph was part of QCLI-2.5's own squashed delivery commit; the scratch-repo path named in the same paragraph already names qcli-2.5).
   - activation-gate-evidence-record.md -- implement the OWNER RULING verbatim: append a further dated note after QCLI-44's existing citation-gap note stating no directing task exists for commit `a4ae6c5` (re-confirmed by this task's own sweep, on top of QCLI-44's original exhaustion of the task store), citing QCLI-46 explicitly as the task that *recorded* the gap, not its author -- the distinction stated explicitly in the prose.
5. Run `lore validate --strict` and `lore check` after edits; fix any reported issue; do not run `lore sync`.
6. Record verbatim gate output, the full per-file sweep table, and the three site dispositions in --append-notes.
7. Commit in small logical commits with `Refs: QCLI-46` trailer (verified via git interpret-trailers) and push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP METHODOLOGY (independent of QCLI-44's counts, run fresh against this branch's docs/ tree, 44 authored files + 6 lore-generated index/log files = all files under docs/):

Pass A - bold-marker grep: `grep -rn -E '\*\*[^*]*(20[0-9]{2}-[0-9]{2}-[0-9]{2}|amend|supersed|Ruling|Review-round|fix \(|correction|Correction|Note \(|Updated \(|Fix pass|owner ruling|Owner ruling)[^*]*\*\*' docs/` -> 72 hits across 17 files. Every hit read in full surrounding context (not just the matched line) and classified conformant/non-conformant against the rule: does the amendment's own marker or its immediate paragraph name a QCLI-task id, without requiring navigation to a separate section via a "see ... below" pointer (the exact defect that made register.md:420 non-conformant even though a task id exists ~35 lines away in a different subsection)?

Pass B - exhaustive date-only sweep on every docs/ file NOT already covered by Pass A's 72 hits, to catch non-bold dated amendment markers: per-file `grep -c` of the date pattern for every remaining file, then full read of each remaining hit. Confirmed all remaining dated text is original-authoring content (frontmatter timestamps, live-verification dates stated as part of a document's own first authoring, e.g. "All commands below were run live by this task on 2026-08-04"), not later corrections to previously-published prose - none needed a task citation because none is an amendment.

Pass C - keyword/strikethrough sweep across all of docs/ for non-conventional amendment phrasing not caught by A/B: `erratum|retract|walked back|walk-back|reversed|revision note|editorial note|addendum|post-merge fix|on reflection|in hindsight|no longer accurate|second pass fix|correction note|amendment note` and literal `~~` strikethrough spans. Found 2 incidental non-amendment usages of "addendum"/"note above" (not new amendment markers) and confirmed the one strikethrough instance (delivery-roadmap.md:291, "~~Who claims D3~~ **Resolved 2026-08-05** by ... (QCLI-27)") was already captured and is conformant.

docs/log.md excluded from the sweep: it is lore's own auto-generated change log (regenerated by `lore sync`), not hand-authored prose, so the inline-supersession convention does not apply to it. docs/*/index.md files are lore-generated indexes; scanned but carry no hand-authored amendment prose.

PER-FILE RESULT (only files with at least one candidate marker are listed; all other docs/ files had zero candidates in Pass A/B/C):

- docs/adr/require-atomic-idempotent-operation-owned-mutations.md:73,78 - conformant (QCLI-44 already added the QCLI-40 citation at :78).
- docs/adr/use-quest-cli-for-the-quest-package-and-command.md:56 - conformant (QCLI-5 cited inline).
- docs/specs/quest-cli-pre-implementation-research-program.md:72 - conformant (QCLI-12 cited inline).
- docs/reference/former-ocli-to-qcli-migration-ledger.md:59,69,123 - conformant (QCLI-2.12, QCLI-13 cited inline).
- docs/specs/quest-cli-delivery-roadmap.md:291 - conformant (QCLI-27 cited inline).
- docs/reference/quest-cli-scale-target-proposal.md:51 - conformant (QCLI-26 cited inline).
- docs/reference/quest-cli-component-contracts-and-delivery-graph.md:98,128,214,292,393,440,448,514,553,648,661,674,700 - all conformant; :214 is original-authoring content (not an amendment), the rest cite QCLI-6/12/21/24/25/26/27/44 inline in the same sentence or paragraph as the marker.
- docs/reference/quest-cli-activation-gate-evidence-record.md:74,97,202,239 - conformant (:97 is original-authoring content; :74,202,239 cite QCLI-44/45 inline). Line 67's own amendment (commit a4ae6c5) is the known SITE 3 - see below.
- docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md:37 and docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md:29 - conformant (QCLI-24, QCLI-25 cited inline).
- docs/reference/quest-cli-packaging-contract.md:80,93 - conformant (QCLI-14, QCLI-23 cited inline); :49 is original-authoring content.
- docs/reference/quest-cli-open-component-decisions.md:114,123,138,250,273,286,290,305,322 - all conformant, cite QCLI-27/28/21/15/17 inline.
- docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md:426,460 - conformant (QCLI-6 cited inline); :38 is original-authoring context ("Owner ruling in force"), not a correction to prior text in this document.
- docs/reference/quest-cli-research-source-register.md:172,366,663,831,832,850,859,906,933,1027,1148,1169,1353,1378,1414 - all conformant, cite QCLI-2.7/2.12/5/6/7/15/17/21/22/23 inline. Line 420 is the known SITE 1 (non-conformant) - see below.
- docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md:376,377,378,381,395 - all conformant (QCLI-23 cited inline).
- docs/reference/quest-cli-backlog-migration-fidelity-contract.md:26 - original-authoring context, not a correction. Line 561 is the known SITE 2 (non-conformant) - see below.

NON-CONFORMANT SET RE-DERIVED (exactly 3 sites; matches the description's floor, no additional site found by this independent sweep):

1. docs/reference/quest-cli-research-source-register.md:420 - "amended 2026-08-04 by the owner's split rule", no task id at the marker (only a "see ... immediately below" pointer to a section that itself doesn't name a directing task for the edit, only the task that later applied the ruling). `git blame` on both the bullet and the split-rule section it points to resolves to commit `2246c46` ("QCLI-2.7: Track Lore dependencies and Quest activation evidence"). DISPOSITION: added an inline dated note citing QCLI-46 (recorder) and QCLI-2.7 (directing task, git-blame confirmed).

2. docs/reference/quest-cli-backlog-migration-fidelity-contract.md:561 - "Review-round fix (2026-08-04).", no task id nearby (missed entirely by QCLI-44's sweep). `git blame`/`git log --follow` resolve the whole paragraph to commit `407ea61` ("QCLI-2.5: Research Backlog migration fidelity through public contracts") - the review-round fix landed inside QCLI-2.5's own squashed delivery commit, pre-merge (consistent with the paragraph's own "/tmp/qcli-2.5-fix-scratch/repo" scratch-repo name). DISPOSITION: added an inline dated note citing QCLI-46 (recorder) and QCLI-2.5 (directing task, git-blame confirmed).

3. docs/reference/quest-cli-activation-gate-evidence-record.md:67 (amendment made by commit `a4ae6c5`) - re-confirmed uncitable: `git show -s a4ae6c5` has no Refs/task trailer (only Co-Authored-By/Claude-Session), and `grep -rl a4ae6c5 backlog/ docs/` returns only the campaign-tracker docs and QCLI-44/46's own task files recording the gap, never a directing task. This matches QCLI-44's own exhaustion of the task store. Per the OWNER RULING recorded in QCLI-46's description (obtained 2026-08-07 at doc-11 wave-1 report): implemented as explicitly uncitable. DISPOSITION: appended a dated note after QCLI-44's existing citation-gap note, stating no directing task exists (re-confirmed by this sweep), citing QCLI-46 explicitly as the task that *recorded* the disposition, not the amendment's author - no citation invented or inferred, no retroactive task filed.

EDITS: all three edits are inline dated ADDITIONS appended after the existing text; nothing existing was deleted, reworded, or re-tensed. Confirmed via `git diff --stat -- docs/` (37 insertions(+), 0 deletions across the 3 files) and `git diff -- docs/ | grep -E '^-[^-]'` returning no output.

GATE OUTPUT (verbatim, run after all three edits, on branch docs/qcli-46-supersession-citation-debt):

$ lore validate --strict
ok docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
ok docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md
ok docs/adr/bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md
ok docs/adr/coordinate-through-git-compare-and-swap-without-a-central-arbiter.md
ok docs/adr/emit-three-categorical-command-outcomes-over-a-versioned-envelope.md
skip docs/adr/index.md (not a concept)
ok docs/adr/keep-lore-optional-and-integrate-only-through-versioned-public-records.md
ok docs/adr/migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar.md
ok docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md
ok docs/adr/require-atomic-idempotent-operation-owned-mutations.md
ok docs/adr/treat-git-tracked-authored-records-as-the-sole-authority.md
ok docs/adr/use-quest-cli-for-the-quest-package-and-command.md
ok docs/index.md
skip docs/log.md (not a concept)
ok docs/reference/former-ocli-to-qcli-migration-ledger.md
skip docs/reference/index.md (not a concept)
ok docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md
ok docs/reference/quest-cli-activation-gate-evidence-record.md
ok docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
ok docs/reference/quest-cli-backlog-migration-fidelity-contract.md
ok docs/reference/quest-cli-black-box-acceptance-scenarios.md
ok docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md
ok docs/reference/quest-cli-component-charter.md
ok docs/reference/quest-cli-component-contracts-and-delivery-graph.md
ok docs/reference/quest-cli-component-glossary-actors-and-workflows.md
ok docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md
ok docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md
ok docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md
ok docs/reference/quest-cli-open-component-decisions.md
ok docs/reference/quest-cli-packaging-contract.md
ok docs/reference/quest-cli-research-source-register.md
ok docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
ok docs/reference/quest-cli-scale-target-proposal.md
skip docs/runbooks/index.md (not a concept)
ok docs/runbooks/quest-cli-research-handover.md
skip docs/specs/index.md (not a concept)
ok docs/specs/quest-cli-architecture.md
ok docs/specs/quest-cli-delivery-roadmap.md
ok docs/specs/quest-cli-functional-requirements.md
ok docs/specs/quest-cli-pre-implementation-research-program.md
ok docs/stories/audit-quest-cli-documentation-authority.md
ok docs/stories/establish-the-quest-cli-component-foundation.md
ok docs/stories/follow-through-on-the-quest-cli-design-layer.md
skip docs/stories/index.md (not a concept)
ok docs/stories/prepare-quest-cli-for-implementation-activation.md
ok docs/stories/prepare-quests-clean-room-research-foundation.md
ok docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
47 files, 0 errors, 0 warnings, 6 skipped
(exit 0)

$ lore check
47 files, 0 errors, 0 warnings
(exit 0)

No `lore sync` was run on this branch at any point.
<!-- SECTION:NOTES:END -->
