---
id: QCLI-10
title: Consolidate QCLI research into an implementation-ready design corpus
status: Done
assignee: []
created_date: '2026-08-05 11:39'
updated_date: '2026-08-05 12:31'
labels:
  - campaign
  - quest
  - cli
  - design
  - architecture
  - requirements
  - roadmap
  - no-implementation
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies: []
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
priority: high
type: feature
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The completed QCLI-1..QCLI-9 research campaign produced twelve deliverables organised by research task rather than by what an implementer needs. This campaign adds a derived design layer over that evidence: an open-decisions register, ADRs promoting settled-but-buried decisions, a functional-requirements Spec with a single ID space, a runtime-neutral architecture Spec, and a staged delivery roadmap.

The twelve research documents are cited as evidence and are not edited, superseded, or rewritten - they carry dated provenance and recheck clauses the clean-room audit depends on.

This campaign adds no product source, no package metadata, and no runtime dependency, and freezes no choice whose required Lore evidence is unfinished. Implementation remains gated on the Lore-owned release gate.

Like QCLI-2, this parent is not dispatched as a worker task; it is settled once its children are Done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The derived design layer exists as five documents and does not modify any of the twelve research deliverables
- [x] #2 Every requirement, decision, and phase in the new layer cites the research document and settling task it derives from
- [x] #3 Runtime, native packaging, supported platforms, projection storage engine, and product license remain open and are recorded as such, not frozen
- [x] #4 No product source, package.json, bin entry, runtime dependency, scaffolding, or install instruction is added
- [x] #5 Strict Lore gates pass: lore validate, lore check, and lore orphans all report zero errors
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Settlement (orchestrator). All five subtasks Done and independently verified before this parent was checked.

Evidence per AC:
- AC1: five documents exist and validate (docs/specs/quest-cli-delivery-roadmap.md, quest-cli-functional-requirements.md, quest-cli-architecture.md; docs/reference/quest-cli-open-component-decisions.md; docs/adr/ x7). git show --stat on commit 1330ecf confirms none of the twelve research deliverables appears as modified - only index files, docs/log.md, the two Story files, and the new documents.
- AC2: each ADR names its source document and settling task in its Status section; the requirements Spec carries a Source legend mapping every source shorthand to its settling task, plus a Source coverage table across all nine structured research sets; the roadmap cites the contracts-and-delivery-graph phase table as its origin.
- AC3: runtime (D2), native packaging (D2), supported platforms (D3), projection storage engine (D5), and product license (D1) all appear in the open-decisions register as open, with D2 and D3 marked unowned. The architecture Spec lists all five under "Deferred by design" linked to their register entries. No ADR freezes any of them; ADR 5 is explicitly Accepted as to contract shape only.
- AC4: ls confirms no package.json, src/, bin/, or lockfile. Grep across all new documents for npm install / npx / bunx / yarn add / pnpm add returns nothing.
- AC5: lore check 37 files 0 errors 0 warnings; lore validate --strict 37 files 0 errors 0 warnings 6 skipped; lore orphans 0 orphan tasks 0 dangling links.

Additional verification beyond the ACs: all 17 BB and all 12 TM scenarios were checked individually as present in the requirements traceability matrix - none uncovered, so no coverage gap needed recording.

Merged to dev as 1330ecf, log sync dde1242, pushed (4a9fc05..dde1242). Direct to dev at user request rather than a branch and PR.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Campaign complete. Added a derived design layer over the QCLI research corpus as five documents: a delivery roadmap (7 phases with entry/exit criteria), a functional-requirements Spec (61 requirements in one FR-AREA-n space with full BB/TM traceability), a runtime-neutral architecture Spec (layers, five ports, trust model, durability tiers, error taxonomy), an open component decisions register (every open item with owner, blocker, unblock condition, and consuming phase), and seven ADRs promoting decisions the research settled but left buried in reference prose. The twelve research deliverables are unmodified and cited as evidence. Runtime, native packaging, supported platforms, projection engine, and license remain open and are recorded as such. No product source, package metadata, or install instruction added. Verified by lore check, lore validate --strict, and lore orphans all reporting zero, plus a per-scenario coverage check across all 17 BB and 12 TM scenarios. Merged to dev as 1330ecf.
<!-- SECTION:FINAL_SUMMARY:END -->
