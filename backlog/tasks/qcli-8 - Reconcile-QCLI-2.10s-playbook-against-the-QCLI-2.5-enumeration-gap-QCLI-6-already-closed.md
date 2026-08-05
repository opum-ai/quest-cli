---
id: QCLI-8
title: >-
  Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration gap QCLI-6
  already closed
status: In Progress
assignee:
  - jeremy.newhouse@salientdata.ai
created_date: '2026-08-05 04:32'
updated_date: '2026-08-05 04:38'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - campaign
  - wave-3
  - in-review
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-6
  - QCLI-2.10
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md (QCLI-2.10's own deliverable) is stale in two places about the research-source-register's 'Prior QCLI research records' slice, both predating QCLI-6:

1. A narrative caveat paragraph (around line 431) stating the register's slice 'lists nine specific members ... and the fidelity contract is not one of them' -- false since QCLI-6: the slice now enumerates fourteen members, including QCLI-2.5's Backlog migration fidelity contract, SHA-pinned.
2. The Sources table's own 'Register classification' cell for the QCLI-2.5 row (around line 426), which points a reader at the now-stale caveat below it as the reason the contract isn't enumerated. This is arguably the worse staleness of the two, since it is a load-bearing classification claim rather than narrative prose.

This is the same reconciliation pattern QCLI-7 already applied to QCLI-2.8's stale caveat: append a dated 'Resolved' note stating the current, correct state, and preserve the original text as the historical record of what that document's own settlement pass found (per this repo's inline-supersession convention -- do not delete or silently rewrite the original).

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12, QCLI-6, and QCLI-7 all operated under. No product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both stale references in quest-cli-backlog-adoption-and-migration-playbook.md (the narrative caveat paragraph and the Sources table's Register classification cell for the QCLI-2.5 row) are reconciled against the register's current state (fourteen members; QCLI-2.5's fidelity contract SHA-pinned since QCLI-6), with the original text preserved as historical record and a dated resolution note appended
- [ ] #2 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #3 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read playbook's current text at both stale spots (Sources-table classification cell for QCLI-2.5 row, ~line 426; narrative caveat paragraph, ~lines 431-458) and QCLI-2.8's precedent fix in quest-cli-component-contracts-and-delivery-graph.md (~lines 69-122) as the template. Confirm register's current state: 'Prior QCLI research records' slice now has 14 members (QCLI-6 addition), QCLI-2.5's fidelity contract SHA-pinned at 418c5eb.
2. Edit the Sources table's Register-classification cell for the QCLI-2.5 row: preserve the original sentence verbatim, append a dated '**Resolved 2026-08-04.**' note in the same cell stating QCLI-6 enumerated the contract (Allowed - Prior QCLI research records, SHA-pinned 418c5eb) and the slice now lists fourteen members, pointing to the caveat's own resolution note below for the full account.
3. Edit the narrative caveat paragraph: preserve the original caveat text verbatim (do not delete/rewrite), and append a new '**Resolved 2026-08-04.**' paragraph directly after it (same shape as QCLI-2.8's precedent) stating the gap is closed, citing QCLI-6, the SHA pin, and the new fourteen-member count, and noting the Sources-table cell's own appended note carries the same correction there.
4. Do not touch the register file itself (out of scope) or any other document.
5. Run lore check --strict, lore validate --strict, lore orphans; fix anything until all three report zero errors/warnings/orphans.
6. Re-read the edited playbook sections directly against AC1-3 to self-verify (no original text deleted, dated note present, slice Classification/one-to-one count untouched since register not edited, no permitted-use narrowed).
7. Record notes via --append-notes, commit in small logical commits with Refs: QCLI-8 trailers, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Two edits to docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md, both preserving original text and appending a dated '**Resolved 2026-08-04.**' note (same pattern QCLI-7 used for QCLI-2.8's caveat):
1. Sources table Register-classification cell for the QCLI-2.5 row (~line 426): original 'not yet an enumerated member ... slice' sentence kept verbatim, with an appended note stating QCLI-6 enumerated the contract (Allowed — 'Prior QCLI research records', SHA-pinned 418c5eb) and the slice now lists fourteen members, pointing to the caveat's own resolution note below.
2. Narrative caveat paragraph (~lines 431-458): original caveat text kept verbatim; a new 'Resolved 2026-08-04.' paragraph appended directly after it citing QCLI-6, the 418c5eb pin, the new fourteen-member count, and noting the table cell's own appended note carries the same correction there.

No register or other document edits (out of scope, and register already authoritative since QCLI-6).

Verification: found 2 pre-existing lore check --strict errors (status-drift + managed-block-drift on docs/stories/prepare-quests-clean-room-research-foundation.md) and 1 pre-existing lore orphans hit (QCLI-8 itself, unlinked to the campaign Story) — none caused by my playbook edits; they predated this task (QCLI-7's Done status was never synced into the Story's managed block, and QCLI-8 was created without a lore link). Resolved both via the standard lore workflow: 'lore link stories/prepare-quests-clean-room-research-foundation QCLI-8' (couples the task, auto-committed backlog/tasks/qcli-8*.md) then 'lore sync' (regenerated the Story's managed tasks block and docs/log.md, also fixing QCLI-7's stale In-Progress row and its missing log entries). All three gates now report zero errors/warnings/orphans: 'lore check --strict' -> 25 files, 0 errors, 0 warnings; 'lore validate --strict' -> 25 files, 0 errors, 0 warnings, 6 skipped; 'lore orphans' -> 0 orphan tasks, 0 dangling links.

Commits: 5efeb9d (playbook reconciliation), 452dc33 (lore sync managed-block/log reconciliation), plus the lore-link auto-commit d6069e6 (chore(backlog): add doc back-references (lore link)) which precedes both and does not itself carry a Refs trailer per repo convention for tool-generated commits.
<!-- SECTION:NOTES:END -->
