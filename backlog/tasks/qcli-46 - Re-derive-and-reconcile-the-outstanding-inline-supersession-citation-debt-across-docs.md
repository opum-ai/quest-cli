---
id: QCLI-46
title: >-
  Re-derive and reconcile the outstanding inline supersession-citation debt
  across docs
status: To Do
assignee: []
created_date: '2026-08-07 18:52'
labels:
  - campaign
  - 'cluster:supersession-convention'
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
