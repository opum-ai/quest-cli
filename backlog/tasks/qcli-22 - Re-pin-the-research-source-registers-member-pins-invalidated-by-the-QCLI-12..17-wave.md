---
id: QCLI-22
title: >-
  Re-pin the research source register's member pins invalidated by the
  QCLI-12..17 wave
status: To Do
assignee: []
created_date: '2026-08-05 14:37'
labels:
  - campaign
  - 'cluster:provenance'
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
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
- [ ] #1 The component charter's pin is decoupled from the ADR's and repointed to d871d32 (or converted to a self-pin, if the task judges that more durable given the charter is now amended by ongoing follow-through work). The ADR keeps 942da73, independently re-verified as still that file's last-touching commit
- [ ] #2 The research Spec's pin is decoupled from the Lore dependency evidence document's and repointed to 1dd4aa6; the evidence document keeps 157ad56, re-verified
- [ ] #3 The packaging contract's pin is decoupled from the legacy Opum reconciliation's and repointed to 077d3be; the reconciliation keeps 3b5cd8c, re-verified
- [ ] #4 Every new SHA is verified with the register's own documented method -- git log --format=%h-%cI -1 -- path, cross-checked against git show -s --format=%cI SHA and git show --stat SHA -- and the verification is recorded in the pin text the same way the existing pins record theirs
- [ ] #5 The three self-pins "read live 2026-08-04" retrieval stamps are explicitly dispositioned: either refreshed to 2026-08-05 with the amending task and commit named, or left with a stated reason why the stamp is not a freshness claim. Not left silently unaddressed
- [ ] #6 All derived summary prose is updated in the same pass: the distinct-SHA enumeration, the total-count sentence, and the running self-pinned/commit-pinned counts elsewhere in the same register slice. If all three stale pins are repinned rather than converted to self-pins, the distinct-SHA count goes from 8 to 11 and 942da73, 157ad56, and 3b5cd8c each drop to pinning one member
- [ ] #7 The eight pins verified still correct (the ADR at 942da73, the legacy Opum reconciliation at 3b5cd8c, the black-box acceptance scenarios document at 883b445, the component glossary at 63b1e0a, the Lore dependency evidence document at 157ad56, the migration fidelity contract at 418c5eb, the threat model at 739aa7e, the adoption playbook at 1a61989) are re-verified and left unchanged
- [ ] #8 All changes are inline, dated, and cite this task, following the register's own QCLI-6/QCLI-7/QCLI-9 correction precedent. No Classification value changes and no permitted use is narrowed
- [ ] #9 The wording tension between the register's Notes section describing this audit as closing two residual findings and the same section elsewhere stating they remain open is reconciled so the audit's own conclusion is stated consistently
- [ ] #10 The task self-pins the register in the same pass if its own edit invalidates the register's own self-pin retrieval stamp, per the standing pin-handling criterion this campaign's tasks have carried since wave 1
- [ ] #11 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->
