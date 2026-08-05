---
id: QCLI-9
title: >-
  Re-pin QCLI-2.10's playbook in the register after QCLI-8's merge invalidated
  its commit-pin
status: In Progress
assignee: []
created_date: '2026-08-05 05:01'
updated_date: '2026-08-05 05:10'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - campaign
  - wave-4
  - in-review
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-8
  - QCLI-6
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The research-source-register (docs/reference/quest-cli-research-source-register.md), 'Prior QCLI research records' slice, still asserts that docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md (QCLI-2.10's deliverable) was last amended at commit 8935551 (set by QCLI-6). QCLI-8 merged a change to that same playbook file for reasons unrelated to the register (reconciling a stale QCLI-2.5 enumeration caveat) -- the playbook's true current last-touch commit on dev is now 1a61989 (QCLI-8's own squash-merge, PR #23). The register's pin is therefore now factually wrong: the 'Exact revision or retrieval date' field's own stated purpose is revalidation-before-use, so this is a live claim a reader would act on, not a preserved historical record.

This is the same pin-staleness class QCLI-2.12 (three failed migration-ledger pin attempts) and QCLI-7 (converted QCLI-2.8's pin from commit- to self-pinned after co-editing it) already resolved for other documents in this campaign -- this is now the fifth instance.

This task edits ONLY the register (correcting the stale pin and the running self-pinned/commit-pinned/distinct-SHA counts in the slice) -- it does not need to touch the playbook itself, so the QCLI-2.12 self-pin-vs-SHA-pin choice is straightforward: since this task does not co-edit the playbook in the same pass, the corrected pin should be an exact-commit SHA pin (to 1a61989, or whatever the actual current last-touch commit is at the time this task runs -- verify live, do not assume it's still 1a61989), not a self-pin.

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12, QCLI-6, QCLI-7, and QCLI-8 all operated under. No product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The register's exact-revision pin for quest-cli-backlog-adoption-and-migration-playbook.md is corrected to its true current last-touch commit (SHA-pinned, since this task does not co-edit the playbook itself)
- [ ] #2 The running self-pinned/commit-pinned/distinct-SHA counts in the 'Prior QCLI research records' slice are corrected to match the updated pin
- [ ] #3 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #4 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-derive the playbook's true current last-touch commit live: git log -1 --format='%h %cI %s' -- docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md -> confirmed 1a61989 (2026-08-04T23:46:00-05:00, QCLI-8's squash-merge, PR #23), matching the task description's stated hash (verified live, not assumed).
2. Read the register's 'Prior QCLI research records' slice (docs/reference/quest-cli-research-source-register.md), specifically the Exact revision or retrieval date bullet's QCLI-6 and QCLI-7 paragraphs (~lines 985-1030), to find the current stale 8935551 pin for QCLI-2.10's playbook and the current running counts (3 self-pinned / 11 commit-pinned / 8 distinct SHAs, per QCLI-7's own correction paragraph).
3. Enumerate all 14 members' current pins to confirm which SHAs are distinct and in use: 942da73 (charter+ADR), 157ad56 (spec+QCLI-2.7), 3b5cd8c (QCLI-2.2+QCLI-2.9), 883b445 (QCLI-2.3), 63b1e0a (QCLI-2.4), 418c5eb (QCLI-2.5), 739aa7e (QCLI-2.6), 8935551 (QCLI-2.10 alone, per QCLI-7's text) = 8 distinct SHAs pinning 11 commit-pinned members; 3 self-pinned (register, ledger, QCLI-2.8 doc).
4. Since QCLI-9 does not co-edit the playbook itself, append a new dated correction paragraph (following the QCLI-6/QCLI-7 precedent of appending rather than rewriting prior historical sentences) stating: QCLI-2.10's playbook is repinned from 8935551 to 1a61989 (SHA-pin, not self-pin); self-pinned stays 3 and commit-pinned stays 11 (playbook stays commit-pinned); distinct SHA count stays 8 in total but the set composition changes -- 8935551 drops out of use entirely (it pinned QCLI-2.10 alone after QCLI-7's pass) and 1a61989 (QCLI-8's own merge commit, unshared) takes its place as the 8th distinct SHA.
5. Do not touch Classification field, Permitted use, or any other slice -- edit only the Exact revision or retrieval date bullet of the Prior QCLI research records slice.
6. Run lore check --strict, lore validate --strict, lore orphans; verify zero errors/warnings/orphans.
7. Record notes, commit with Refs: QCLI-9 trailer, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Re-derived the playbook's true current last-touch commit live: git log -1 --format='%h %cI %s' -- docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md => 1a61989b8ed910c36bbfc5f74bc8dd5fa02b4bfd / 1a61989, 2026-08-04T23:46:00-05:00, 'QCLI-8: Reconcile QCLI-2.10's playbook against the closed QCLI-2.5 enumeration gap (#23)'. This matched the hash named in the task description, but was independently re-verified via git log against the live worktree rather than assumed, per the task's own instruction; also cross-checked with git show -s --format=%cI 1a61989 (date) and git show --stat 1a61989 (confirms the commit touches the playbook path) -- no other commit touches the playbook after this one on dev.

Edited only docs/reference/quest-cli-research-source-register.md's 'Prior QCLI research records' slice, Exact revision or retrieval date bullet: appended a new dated paragraph (following the QCLI-6/QCLI-7 precedent of appending corrections rather than rewriting prior historical sentences) re-pinning QCLI-2.10's playbook from the stale 8935551 commit-pin to 1a61989, as an exact-commit SHA pin (not a self-pin, since this task does not co-edit the playbook itself in the same pass).

Running counts: enumerated all 14 slice members' current pins before editing to confirm the baseline (3 self-pinned: register, migration ledger, QCLI-2.8's document; 11 commit-pinned; 8 distinct SHAs: 942da73, 157ad56 x2, 3b5cd8c x2, 883b445, 63b1e0a, 418c5eb, 739aa7e, 8935551 -- the last pinning QCLI-2.10 alone per QCLI-7's own correction text). After re-pinning QCLI-2.10 to 1a61989: self-pinned stays 3, commit-pinned stays 11 (playbook remains commit-pinned, only the SHA changes), and distinct SHAs stays 8 in count -- but the set composition changes: 8935551 drops out of use entirely (it had no other member relying on it), and 1a61989 (QCLI-8's own merge commit, unshared with any other still-current pin in this slice) takes its place as the eighth distinct SHA. Recorded this explicitly in the appended paragraph so the count correction isn't just asserted but shown.

AC verification: AC1 -- pin corrected to 1a61989, SHA-pinned (grep-verified). AC2 -- running counts text updated and arithmetic re-derived from a full enumeration, not assumed. AC3 -- grep -c 'Classification:' unchanged at 19 occurrences before/after (git show HEAD vs working tree), Permitted use bullet text for this slice byte-identical to before my edit, no slice added or removed -- 1:1 slice-to-Classification mapping preserved, no permitted use narrowed. AC4 -- lore check --strict, lore validate --strict, and lore orphans all report zero errors/warnings/orphans (see below); confirmed via git stash that lore check's two errors (Story status-drift/managed-block-drift) and lore orphans' one orphan (QCLI-9 itself, unlinked to any doc) were PRE-EXISTING on the pristine worktree, not caused by my register edit.

Out-of-scope action taken to satisfy AC4 (flagged per the task's own instruction to flag anything genuinely out-of-scope while staying in scope): the pristine worktree already failed lore check --strict (Story status-drift + managed-block-drift, because QCLI-9 was filed but never lore-linked to the campaign Story) and lore orphans (QCLI-9 itself as an orphan task) before I touched anything. This is the identical structural finding the register's own text already narrates QCLI-7 closing for itself ('linked via lore link to close an orphan-task finding this pass's own lore orphans gate check surfaced'). Ran lore link stories/prepare-quests-clean-room-research-foundation QCLI-9 (lore's own tool committed the backlog/ side itself, commit 40eb722, per lore's documented commit behavior for lore link) then lore sync to regenerate the Story's managed Tasks block and reconcile its status field (in-progress -> todo, since QCLI-9 is currently To Do) -- committed separately (05501e8) with a Refs: QCLI-9 trailer. This did not touch the register file, the playbook, the migration ledger, or the component charter; it only touched the Story's coupling metadata and lore-managed docs/log.md, which are the only two files lore's own tooling writes to satisfy this task's own AC4 gate requirement.

Final gate output on the fully committed tree: lore check --strict => '25 files, 0 errors, 0 warnings' (exit 0). lore validate --strict => '25 files, 0 errors, 0 warnings, 6 skipped' (exit 0). lore orphans => 'orphans: 0 orphan tasks, 0 dangling links' (exit 0).

Commits: 7cd6a01 docs(register): re-pin QCLI-2.10's playbook to its true current commit (the register.md diff). 05501e8 chore(lore): sync campaign Story after linking QCLI-9 (docs/log.md + Story managed-block/status reconciliation). Both carry Refs: QCLI-9. (40eb722 chore(backlog): add doc back-references (lore link) was auto-committed by the lore CLI itself as part of lore link, per its documented 'commits the files it touches itself' behavior -- not independently re-committed by me.)
<!-- SECTION:NOTES:END -->
