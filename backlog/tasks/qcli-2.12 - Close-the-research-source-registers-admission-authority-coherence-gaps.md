---
id: QCLI-2.12
title: Close the research source register's admission-authority coherence gaps
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-04 14:34'
updated_date: '2026-08-04 16:50'
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
