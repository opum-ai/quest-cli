---
id: QCLI-2.12
title: Close the research source register's admission-authority coherence gaps
status: To Do
assignee: []
created_date: '2026-08-04 14:34'
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
<!-- AC:END -->
