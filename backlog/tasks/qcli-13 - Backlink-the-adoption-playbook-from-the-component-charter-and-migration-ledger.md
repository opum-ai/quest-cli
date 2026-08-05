---
id: QCLI-13
title: Backlink the adoption playbook from the component charter and migration ledger
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:05'
labels:
  - campaign
  - 'cluster:adoption'
  - migration
  - navigation
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.10 recorded that the component charter and migration ledger were not backlinked from its new playbook or vice versa, because that task was explicitly instructed not to edit either file even to add a backlink. It was never filed.

Verified on 2026-08-05: the playbook DOES cite both (lines 75 and 427-428), so only one direction is missing - neither the charter nor the migration ledger links to the playbook. Scope is therefore narrower than the original note implies: add the missing inbound links, do not re-add outbound ones that already exist.

Known trap: both target files may be pinned by the research source register. Check before merging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The component charter links to the adoption and migration playbook from a contextually appropriate place
- [ ] #2 The migration ledger links to the adoption and migration playbook from a contextually appropriate place
- [ ] #3 The playbook's existing outbound citations are left unchanged, since they already exist
- [ ] #4 If the research source register pins either edited document, the pin is handled in the same pass or the need for a separate correction is recorded
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the playbook (docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md) to confirm its existing outbound citations to the charter (line 75) and the migration ledger (lines 427-428) and leave both untouched (AC3).
2. Component charter (docs/reference/quest-cli-component-charter.md): in the 'Owns here' list, link the existing 'migration, coexistence, aliases, and reversible fidelity reports' bullet to the playbook - this is the exact bullet the playbook's own intro cites as its charter grounding, so this closes that specific loop rather than adding a generic 'see also'.
3. Migration ledger (docs/reference/former-ocli-to-qcli-migration-ledger.md): add a sentence to the 'Source provenance boundary' section noting the playbook cites this ledger as read-only background (mirroring the playbook's own Sources table row for the ledger), with a link. Does not touch the OCLI/QCLI mapping table.
4. Read (do not edit) docs/reference/quest-cli-research-source-register.md to check whether it pins either edited file, per the known trap. Per explicit dispatch instruction for this parallel wave, do NOT edit the register even if a pin is found - record findings in --append-notes instead so a follow-up task can act. QCLI-15 is concurrently editing that file in this same wave; touching it would risk a merge collision.
5. Run lore validate --strict, lore check, and lore orphans and capture exact output.
6. Record notes and evidence via --append-notes; commit docs/ changes with a Refs: QCLI-13 trailer; push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Added missing inbound links (AC1/AC2):
- Component charter (docs/reference/quest-cli-component-charter.md), 'Owns here' list: the 'migration, coexistence, aliases, and reversible fidelity reports' bullet now links to the playbook - this is the exact bullet the playbook's own intro (line 74-76) cites as its charter grounding, so this closes that specific citation loop.
- Migration ledger (docs/reference/former-ocli-to-qcli-migration-ledger.md), 'Source provenance boundary' section: added a sentence noting QCLI-2.10's playbook cites this ledger as read-only background, mirroring the playbook's own Sources table row for the ledger. The OCLI/QCLI mapping table itself is untouched.
- Playbook's own outbound citations (line 75 to the charter, lines 427-428 to the ledger) verified unchanged (AC3) - confirmed via git diff --stat showing zero changes to the playbook file.

Register pin check (AC4), per this dispatch's MANDATORY instruction NOT to edit docs/reference/quest-cli-research-source-register.md (QCLI-15 is concurrently editing it in this same wave; three other siblings share the identical trap) - register read only, not edited:
- Component charter IS pinned: register lines 924-929 pin it to an exact commit SHA `942da73` (2026-08-04 07:21:12 -0500, the QCLI-5 org-identity commit, jointly with the accepted ADR). This task's edit to the charter changes its last-amended commit away from `942da73`, so that SHA pin is now stale. FOLLOW-UP NEEDED: the register's component-charter pin bullet (around line 924-929) must be updated - either re-derive and re-pin to this task's new commit SHA, or (more robustly, and consistent with precedent already in the same register passage) convert it to a live/current-state pin the way the register already did for the migration ledger and for itself, since the charter is now also being amended by ongoing follow-through tasks in this wave.
- Migration ledger is NOT commit-pinned: register lines 918-921 and 930-951 explicitly live-pin the ledger 'to its own current state on this branch' rather than to a SHA, precisely because the register's own text says an exact-SHA pin cannot survive a document that keeps getting co-edited (three prior SHA-pin attempts on this same ledger each went stale). Because the pin type is already 'live/current-state', this task's edit does not break it - no follow-up correction needed for the ledger's pin.

Lore gates (AC5), run from worktree root after lore sync:
- lore sync: updated docs/log.md and the campaign story's managed task-status block (QCLI-13 -> In Progress), auto-committed backlog/ (1 file, the --plan write) as commit 1c1fa56 - expected per lore sync's own behavior, not an error.
- lore validate --strict: 38 files, 0 errors, 0 warnings, 6 skipped (index.md/log.md are non-concept files). Exit 0.
- lore check: 38 files, 0 errors, 0 warnings. Exit 0.
- lore orphans: 0 orphan tasks, 0 dangling links. Exit 0.

Scope note: only the two target files were edited, plus docs/log.md and the story's managed block as unavoidable lore sync side effects (same class the dispatch pre-authorized), plus the pre-existing backlog/ plan-write auto-commit from lore sync. The register and the playbook were not modified.

Recorded finding (F1, reviewer follow-up): docs/reference/quest-cli-open-component-decisions.md's 'Residual items recorded but never filed' table (around line 218) contains the row: "The playbook and the charter and migration ledger are not backlinked to each other | QCLI-2.10, which was instructed not to edit either file | Navigation gap between the operational procedure and its governing records". QCLI-13 closes exactly the gap this row describes: the charter and the migration ledger are now backlinked to the playbook (see AC1/AC2 above), and QCLI-13 was not the QCLI-2.10 task that was barred from editing them. QCLI-17 is this wave's current editor of quest-cli-open-component-decisions.md, but QCLI-17's acceptance criteria are confined to a different section of that file (the Backlog.md v1.49.3 reclassification trigger) and do not cover this row. This row is therefore stale/false as of QCLI-13 merging, and a separate future correction task is needed to update or remove it. Per this task's dispatch instruction, QCLI-13 does NOT edit quest-cli-open-component-decisions.md itself; this is a recorded finding only, not an edit.

Fix pass (F2/F3, reviewer follow-up): repositioned the QCLI-13 backlink sentence in docs/reference/former-ocli-to-qcli-migration-ledger.md's 'Source provenance boundary' section. It previously sat mid-paragraph immediately before the '**Amended 2026-08-04 by QCLI-2.12**' block, but that amendment amends the preceding (unrelated) sentence about QCLI-2.1's revalidation, not the QCLI-13 sentence, so the insertion point was misleading. Moved the sentence to its own paragraph at the end of the section, after the full QCLI-2.12 amendment/correction train and immediately before '### Preservation rules'. Also added a dated attribution marker matching the section's existing convention (e.g. 'Amended 2026-08-04 by QCLI-2.12', 'Condition fired (QCLI-2.3, 2026-08-04)'): the sentence now opens with '**Added 2026-08-05 by `QCLI-13`:**'. The component charter edit is intentionally left unmarked, per this same review: the charter has no such dated-attribution convention anywhere (zero hits for Amended/Corrected/Updated 2026/Added 2026), so marking only the charter would be out of convention there.

Expanded register-pin follow-up note (F4, reviewer follow-up) with two details the eventual correction pass needs: (a) The register pins the component charter and the accepted ADR (docs/adr/use-quest-cli-for-the-quest-package-and-command.md) JOINTLY in one sentence (register lines ~924-929) to the same commit 942da73. Verified independently: 'git log -1 -- docs/adr/use-quest-cli-for-the-quest-package-and-command.md' still shows 942da73 as that file's last-touching commit, so the ADR's half of the joint pin remains correct and must NOT be repointed. Because QCLI-13 only amends the charter, not the ADR, the eventual fix must DECOUPLE the two pins (re-pin or self-pin the charter alone), not repoint both to a new shared SHA. (b) The register maintains explicit running counts of pin types across its 14-member 'Prior QCLI research records' enumeration, updated inline at each amendment (register lines ~1026-1028 and ~1047-1050): 'three of the fourteen members are now self-pinned (this register, the migration ledger, and QCLI-2.8's document), eleven are commit-pinned, and eight distinct SHAs remain in use'. A future self-pin or re-pin conversion for the charter would shift these counts (self-pinned members 3->4, commit-pinned members 11->10, and possibly the distinct-SHA count if 942da73 stops being used elsewhere) and must update this running-count prose in the same pass, following the register's own established precedent for such updates (see the QCLI-7 and QCLI-9 correction passes in that same section).
<!-- SECTION:NOTES:END -->
