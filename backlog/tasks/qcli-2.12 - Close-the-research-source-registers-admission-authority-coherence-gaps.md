---
id: QCLI-2.12
title: Close the research source register's admission-authority coherence gaps
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-04 14:34'
updated_date: '2026-08-04 17:14'
labels:
  - campaign
  - research
  - provenance
  - register
  - correction
  - no-implementation
  - 'cluster:provenance'
dependencies:
  - QCLI-2.11
parent_task_id: QCLI-2
priority: high
type: docs
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three defects in the campaigns admission authority, surfaced only by reading the three wave-2 merges together. The register is the per-slice admission authority — a source may inform a QCLI requirement only if a slice classifies it Allowed — so an authority that cannot cleanly apply its own rules to its own slices is the campaigns highest-value defect class. Wave 1s blocking defect and two of wave 2s were exactly this.

Documentation only. Do not reclassify any source, and do not narrow any permitted use that a merged deliverable already relies on.

1. The lore-cli Backlog.md corpus slice states its catch-all twice with materially different triggers: under "Repository or URL" as "any further lore-cli document deriving from Backlog.md source", and under "Exclusions" as "any further lore-cli document a worker discovers asserting an uncited claim about how Backlog.md behaves". The release-gate-evidence slice then classifies docs/runbooks/release-publishing.md Allowed with a section-scoped carve-out for its Prerequisites block. Apply the two formulations and they diverge: under Exclusions a release-history fact is not a behavior claim, so the carve-out is the right instrument; under Repository/URL it plausibly qualifies wholesale, which would make the document Contextual, citable for nothing, and retroactively invalidate QCLI-2.7s own Part 3 drift-table citations of it. The register never states which rule wins.

2. QCLI-2.7s metadata widening left an asymmetry: the Excluded npm-occupancy slice now permits more registry-metadata fields than the Allowed lore-cli slice does for the same class of data. Two names QCLI-2.9 cites are enumerated by no slice at all — @opum-ai/quest-cli (a 404 observation) and @opum-ai/lore maintainer identity (the lore-cli slices enumerated permitted use covers published CLI surface, not registry maintainer fields).

3. docs/reference/former-ocli-to-qcli-migration-ledger.md states no source slice is admitted "until QCLI-2.1 verifies" it. QCLI-2.7 has since added two slices, widened a third, and retired a closed list for a catch-all, all under owner ruling, so the sentence under-describes who may amend the register.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Backlog-corpus catch-all states one test, in one formulation, in both fields that reference it
- [ ] #2 The release-gate-evidence slice carries an explicit precedence rule for a document reachable by both it and the Backlog-corpus catch-all, and that rule preserves the existing release-publishing.md drift-table citations as admissible
- [ ] #3 Every npm name cited by a merged wave-2 deliverable is enumerated in some slice whose permitted use covers the fields actually cited, specifically @opum-ai/quest-cli and @opum-ai/lore maintainer identity
- [ ] #4 The migration ledgers source-provenance boundary admits owner-ruled register amendments recorded after QCLI-2.1
- [ ] #5 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
- [ ] #6 Every in-repo document cited by a merged QCLI-2.x deliverable under the register's `Prior QCLI research records` slice is enumerated by that slice, specifically the research source register itself (cited by QCLI-2.3) and QCLI-2.2's legacy requirement reconciliation (also cited by QCLI-2.3) — neither is currently named in the slice's own enumeration
- [ ] #7 The `quest-doc canonical product records` slice's permitted use states explicitly whether it governs only the register's own citations or any QCLI deliverable's, and confirms it covers the execution graph's behavioral-contract vocabulary as QCLI-2.4 actually cites it (a different document section / use than the slice's register-first-person wording straightforwardly enumerates). No permitted use is narrowed below what a merged deliverable already relies on
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. AC1: In the register's 'lore-cli Backlog.md corpus' slice, unify the catch-all's two divergent formulations. The Exclusions field already states the operative test ("asserts an uncited claim about how Backlog.md behaves") and the Ownership rationale field already restates it the same way; only the Repository/URL field diverges ("any further lore-cli document deriving from Backlog.md source"). Rewrite the Repository/URL field's catch-all clause to match the Exclusions/Ownership-rationale formulation verbatim, noting the unification.
2. AC2: In the register's 'lore-cli release-gate evidence' slice, append an explicit precedence rule to the Exclusions field: when a document (release-publishing.md) is reachable by both this slice and the Backlog-corpus catch-all above, this slice's own named classification/carve-out governs (a named, individually-classified document is not swept in by the catch-all, which exists for undiscovered documents). State that only the named Prerequisites bullet is excluded and the rest of release-publishing.md, including the content QCLI-2.7's Part 3 drift table cites, stays Allowed/citable.
3. AC3: (a) Add `@opum-ai/quest-cli` (404, cited by QCLI-2.9's packaging contract) to the npm package name occupancy slice's Repository/URL enumeration. (b) Widen the lore-cli slice's Permitted use to admit `@opum-ai/lore`'s ordinary registry metadata (license, repository, maintainer identity, description, publish history) as naming-pattern/allocation evidence, mirroring the npm-occupancy slice's own widened field list, to cover QCLI-2.9's citation of @opum-ai/lore maintainer identity. Verify both against quest-cli-packaging-contract.md's actual citations first.
4. AC4: In the migration ledger's 'Source provenance boundary' section, amend the closing sentence ("No source slice is admitted... until QCLI-2.1 verifies...") to state that QCLI-2.1 is the founding admission event, not the only one, and that later owner-ruled register amendments (naming QCLI-2.7's two added slices, one widened slice, and the retired closed-list-for-catch-all, each dated 2026-08-04 under owner ruling) are themselves the required six-field verification for their own amendments.
5. AC6: In the register's 'Prior QCLI research records' slice, add to Repository/URL: QCLI-2.2's legacy-opum-requirement-reconciliation-for-quest-cli.md and the register itself (quest-cli-research-source-register.md) — both cited under this slice by QCLI-2.3's black-box-scenarios evidence table (verified via grep) but not currently named in the enumeration. Light touch to Ownership rationale for coherence.
6. AC7: In the register's 'quest-doc canonical product records' slice, rewrite Permitted use to state explicitly that the slice governs citation by any QCLI deliverable, not only this register's own alignment language (the original wording is retained as one named use), and add explicit coverage of the execution graph's 'Core behavioral contract' vocabulary section as QCLI-2.4's component-glossary document actually cites it (verified via grep) — a different section/use than the original provenance/migration-ledger wording enumerates. No narrowing.
7. Verification: for each AC, quote exact before/after text in notes; re-verify QCLI-2.9/2.3/2.4/2.7 citations with grep/read (not memory). Diff Classification lines before/after (must be identical) and confirm slice count unchanged (no new #### headings added). Run `lore check --strict`, `lore validate --strict` on both files, and `lore orphans`; if `lore sync` is needed for managed blocks, run it and git add the regenerated files explicitly (no auto-commit in this environment).
8. Commit in small logical commits (one or two per AC cluster) with `Refs: QCLI-2.12` trailers, append notes with decisions/verification evidence, then push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete. All 7 ACs addressed in docs/reference/quest-cli-research-source-register.md and docs/reference/former-ocli-to-qcli-migration-ledger.md; no other files touched. No Classification field changed value (verified: git diff shows zero +/- lines matching '**Classification:**'); #### slice-heading count (18) and Classification-field count (19) are unchanged before/after (verified via grep -c against base commit 94529f0).

AC1 — Backlog-corpus catch-all unified: Repository/URL field previously read "any further lore-cli document deriving from Backlog.md source"; Exclusions/Ownership-rationale already used "asserting an uncited claim about how Backlog.md behaves" (the test actually applied to ADR-0009/tag-watch doc). Rewrote Repository/URL to match the Exclusions formulation verbatim. Commit cad41b1.

AC2 — release-gate-evidence precedence rule added: new sentence in that slice's Exclusions field states a document individually named/classified in its own slice (release-publishing.md, lore-cli-release-truth.md) is governed by that slice, not swept in by the Backlog-corpus catch-all (which exists for undiscovered documents). Verified QCLI-2.7's Part 3 drift table (docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md:357) cites release-publishing.md in the "What the 29 commits touch in docs/" row, outside the Prerequisites carve-out — citation preserved as admissible. Commit cad41b1.

AC3 — npm names enumerated: (a) added @opum-ai/quest-cli (404) to the npm-occupancy slice's Repository/URL list — verified cited in docs/reference/quest-cli-packaging-contract.md:73,125-128 (QCLI-2.9). Commit 670f495. (b) widened the lore-cli slice's Permitted use to cover @opum-ai/lore registry metadata (license, repository, maintainer identity, description, publish history) — verified QCLI-2.9's packaging-contract.md:78,169 cites @opum-ai/lore maintainer identity ("jeremy-newhouse <...>") under a claim that the lore-cli slice already covers it, which it previously did not. Commit cad41b1.

AC4 — migration ledger boundary widened: former-ocli-to-qcli-migration-ledger.md's "No source slice is admitted... until QCLI-2.1 verifies..." sentence amended to state QCLI-2.1 is the founding admission event, not the only one, naming QCLI-2.7's 2026-08-04 owner-ruled additions (two new slices, one widened slice, one closed-list-to-catch-all retirement) as later admitting amendments. Commit ad776bb.

AC5 — verification: see gate outputs below; Classification/count checks above.

AC6 — Prior QCLI research records enumerated: added QCLI-2.2's legacy-opum-requirement-reconciliation-for-quest-cli.md and the register itself to that slice's Repository/URL field. Verified both are cited under "Allowed — 'Prior QCLI research records'" in docs/reference/quest-cli-black-box-acceptance-scenarios.md rows 56-57 (QCLI-2.3) via grep, previously enumerated only QCLI-1/3/4 and their outputs. Commit 670f495.

AC7 — quest-doc canonical product records scope clarified: Permitted use rewritten to state explicitly it governs citation by any QCLI deliverable, not only this register's own text, and to name the execution graph's "Core behavioral contract" vocabulary section as a second, distinct admissible use alongside the original provenance/migration-ledger wording (kept unchanged, not narrowed). Verified via grep that docs/reference/quest-cli-component-glossary-actors-and-workflows.md (QCLI-2.4) cites this exact section repeatedly (lines 86-88, 114-172) under this slice. Commit 670f495.

Gate outputs (post-edit, re-run after final commit):
- lore check --strict -> "21 files, 0 errors, 0 warnings" (exit 0)
- lore validate --strict <register> <ledger> -> "ok" both files, "2 files, 0 errors, 0 warnings, 0 skipped" (exit 0)
- lore orphans -> "0 orphan tasks, 0 dangling links" (exit 0)

lore sync was run twice; it regenerated docs/log.md only (no Story managed-block changes touched this task) and does not auto-commit docs/ in this environment, so both regenerations were committed explicitly (commits 435a077, 2b84396). It also auto-committed a backlog/ sync (chore(backlog): sync task changes, commit 8b5e8b6) when the --plan edit was recorded, per its normal behavior.

Out-of-scope finding to report at settlement: none discovered beyond what the task description already named. All three defects were exactly as scoped; no additional coherence gap surfaced while reading QCLI-2.3/2.4/2.7/2.9's citations against the register.

Review follow-up (2026-08-04): an independent reviewer returned request_changes with 2 blocking findings against AC6 and AC7. Both are now fixed; this corrects this task's own prior notes' overclaim that AC6/AC7 were already fully satisfied by the original pass.

F1 (blocking, AC7) — quest-doc canonical product records' Permitted use previously enumerated only "Two admissible uses" (the register's own use, and the execution graph's "Core behavioral contract" section). QCLI-2.4's already-merged component glossary cites this slice for at least three more things that count excluded: the execution graph's "Runtime authority and product boundary" section (lines 39-57 of quest-doc's quest-clean-room-execution-graph.md, distinct from "Core behavioral contract" at lines 58-74) cited at glossary lines 114, 128, 141, 143; the repository-and-authority-map Reference (docs/reference/quest-repository-and-authority-map.md) cited at glossary lines 259, 281-284; and the glossary's negative-existence claim ("quest-doc's own repository holds no actor-model glossary") at glossary lines 54, 250, grounded in that same Reference. Fixed by rewriting the Permitted use field as a non-exhaustive floor of (1)-(4) named uses instead of an exhaustive "Two" count, naming all three additional uses. Purely additive -- no existing admitted use narrowed. Verified via grep/read against the live quest-doc clone at /Volumes/external/repos/quest-doc (section headings confirmed at exactly lines 39 and 58) and against the glossary's cited line numbers. Commit 77b01f2.

F2 (blocking, AC6) — the Prior QCLI research records slice's Repository or URL enumeration named "QCLI-1, QCLI-3, QCLI-4, and the component charter, migration ledger, and research Spec they produced" plus (from this task's original pass) the register itself and QCLI-2.2's reconciliation doc, but omitted docs/adr/use-quest-cli-for-the-quest-package-and-command.md -- a fourth product of the same QCLI-1/QCLI-3/QCLI-4 lineage (created e2b90e2, amended under QCLI-5 at 942da73), cited under this exact slice ("Allowed -- 'Prior QCLI research records'") by QCLI-2.2's already-merged legacy-opum-requirement-reconciliation-for-quest-cli.md:68. The register's own prose elsewhere (lines 67, 744) cross-referenced the ADR without ever naming it in this slice's enumeration. Fixed by adding the ADR to the Repository or URL field, the same way the original pass added the register and QCLI-2.2's doc; gave Ownership rationale a light touch for coherence. Verified line 68 directly. Commit d6a67e5.

F3 (non-blocking, fixed) — the lore-cli Backlog.md corpus slice's supersession parenthetical said "this one" pointed at the Repository/URL field's text, but by the time that parenthetical runs, the field already reads the unified (post-AC1-fix) formulation, not the superseded one -- so "this one" pointed at the replacement, not what was superseded. Fixed by quoting the actual original wording verbatim ("any further lore-cli document deriving from Backlog.md source"), dated, per this project's inline-supersession convention. Commit da9c529.

F4/F5 (non-blocking, out of scope for this fix pass) — not touched; left for the orchestrator to track.

Re-verification after all three fixes: zero Classification field values changed (grep -c "Classification:" = 19 before and after; diff of Classification lines against pre-fix-pass commit 9a843d9 is empty); slice count unchanged at 19 Classification fields / 18 #### headings + 1 ### npm-occupancy heading (matching the reviewer's correction that the true count is 19:19, not 18); migration ledger and the two QCLI-2.14-owned files (quest-cli-lore-dependency-and-adapter-contract-evidence.md, quest-cli-pre-implementation-research-program.md) untouched. Gate outputs (final, after all commits): `lore check --strict` -> "21 files, 0 errors, 0 warnings"; `lore validate --strict` -> "21 files, 0 errors, 0 warnings, 6 skipped"; `lore orphans` -> "0 orphan tasks, 0 dangling links". `lore sync` regenerated docs/log.md only (managed block picking up the new commits); committed explicitly as commit 9570959 (no auto-commit in this environment).

Commits this follow-up pass: da9c529 (F3), 77b01f2 (F1), d6a67e5 (F2), 9570959 (log sync).
<!-- SECTION:NOTES:END -->
