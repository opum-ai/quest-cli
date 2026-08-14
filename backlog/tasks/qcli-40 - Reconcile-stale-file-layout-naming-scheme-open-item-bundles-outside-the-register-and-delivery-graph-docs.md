---
id: QCLI-40
title: >-
  Reconcile stale "file layout"/"naming scheme" open-item bundles outside the
  register and delivery-graph docs
status: Done
assignee: []
created_date: '2026-08-06 20:53'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:open-item-bundles'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - docs/adr/require-atomic-idempotent-operation-owned-mutations.md
  - docs/specs/quest-cli-architecture.md
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34 and QCLI-38 closed "file layout" and "naming scheme" (citing QCLI-25/D4) in docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md. Two other documents still make live claims that these items remain open, surfaced by the doc-8 campaign wave-1 integration review: docs/adr/require-atomic-idempotent-operation-owned-mutations.md line ~69 ("Deliberately not decided here: the file layout, naming scheme, event schema, and locking primitive... Those remain open in the [open component decisions register]...") and docs/specs/quest-cli-architecture.md line ~223 (the "Deferred by design" table row "Naming scheme, event schema | Git mutation contract open items"), immediately below a row that already marks canonical-ID grammar/authored-record-layout closed. Both are live forward-pointing claims, not historical records, so they need updating to reflect the closures.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/adr/require-atomic-idempotent-operation-owned-mutations.md no longer asserts file layout/naming scheme "remain open" in the register
- [x] #2 docs/specs/quest-cli-architecture.md reflects naming scheme as closed (citing QCLI-25/D4) while leaving event schema open, following the pattern of the row above it
- [x] #3 No other row/section in either file is modified; no historical-record document (the research programme Spec's own Open Questions list, the QCLI-2.6 threat model's non-goals section) is touched -- those intentionally preserve original wording per this repo's supersession convention
- [x] #4 lore validate --strict and lore check both pass with 0 errors and 0 warnings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read established closure wording from docs/reference/quest-cli-open-component-decisions.md (lines 193-194, Git mutation contract rows split by QCLI-34/QCLI-38) and docs/reference/quest-cli-component-contracts-and-delivery-graph.md (lines 431-446, "now closed and no longer open" prose), plus QCLI-34/QCLI-38's own implementation notes, to derive the exact citation pattern (QCLI-25/D4, closed 2026-08-05) already used for file layout and naming scheme.
2. Edit docs/adr/require-atomic-idempotent-operation-owned-mutations.md lines 69-71: split the "Deliberately not decided here" sentence so it names only event schema and locking primitive as remaining open in the register; add a new sentence stating file layout and naming scheme are no longer open, closed 2026-08-05 by the QCLI-25 ADR (D4), linking to the sibling ADR file in the same docs/adr/ directory (matching this file's own existing same-directory link style at line 83) and pointing to the register's Git mutation contract entries. Leave the rest of the file untouched.
3. Edit docs/specs/quest-cli-architecture.md's "Deferred by design" table: split row 223 ("Naming scheme, event schema | Git mutation contract open items") into two rows — "Naming scheme" marked closed citing D4/QCLI-25 with the identical phrasing/link used by row 222 immediately above it ("Canonical identifier grammar, authored-record layout | D4 — closed by [...] (`QCLI-25`)"), and "Event schema" left as "Git mutation contract open items" (unchanged substance). Leave every other row untouched, including line 224 (locking primitive/merge/rebase).
4. Do NOT touch docs/specs/quest-cli-pre-implementation-research-program.md's Open Questions list or the QCLI-2.6 threat model's non-goals section — both are historical-record text per the supersession convention and out of scope (AC3).
5. Run `lore validate --strict` and `lore check`; confirm 0 errors/0 warnings (baseline already confirmed 47 files/0/0 before any edit).
6. Diff-review both files to confirm AC1-AC3 with concrete text evidence.
7. Record notes via --append-notes, commit with Refs: QCLI-40 trailer, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTED.

Grounding: read the closure wording QCLI-34/QCLI-38 established in docs/reference/quest-cli-open-component-decisions.md (lines 193-194, Git mutation contract rows: "File layout"/"Naming scheme" each marked **Closed** citing D4/QCLI-25) and docs/reference/quest-cli-component-contracts-and-delivery-graph.md (lines 431-446, prose: "file layout and naming scheme ... all three **closed 2026-08-05** by [Adopt a T-prefixed canonical identifier grammar and its authored-record layout] (QCLI-25)"). Reused that exact citation (QCLI-25/D4, closed 2026-08-05) rather than inventing new phrasing.

CHANGES:
1. docs/adr/require-atomic-idempotent-operation-owned-mutations.md (lines 69-71 region): split the "Deliberately not decided here" sentence. It now names only event schema and locking primitive as remaining open in the register. Added a new sentence: "The file layout and naming scheme once grouped alongside them here are no longer open: both closed 2026-08-05 by [Adopt a T-prefixed canonical identifier grammar and its authored-record layout] (QCLI-25/D4) — see the register's Git mutation contract entries." Link uses the same-directory relative form already used elsewhere in this file (line 83's precedent), since the QCLI-25 ADR lives in the same docs/adr/ folder.
2. docs/specs/quest-cli-architecture.md "Deferred by design" table: split the row "Naming scheme, event schema | Git mutation contract open items" into two rows — "Naming scheme | D4 — closed by [Adopt a T-prefixed canonical identifier grammar and its authored-record layout](...) (QCLI-25)" (byte-identical phrasing/link to the row immediately above it for canonical identifier grammar/authored-record layout, per AC2's explicit instruction to match that row's pattern) and "Event schema | Git mutation contract open items" (unchanged substance, now its own row). The locking-primitive/merge-rebase row below (line 224, now 225) is untouched.

NOT touched (confirmed via git diff): docs/specs/quest-cli-pre-implementation-research-program.md's Open Questions list and docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md's (QCLI-2.6) non-goals section — both are historical-record text under this repo's supersession convention, out of scope per AC3. No other row/section in either target file was modified (git diff --stat confirms only the two intended hunks).

VERIFICATION:
- lore validate --strict: "47 files, 0 errors, 0 warnings, 6 skipped", exit 0 (same as pre-edit baseline).
- lore check: "47 files, 0 errors, 0 warnings", exit 0 (same as pre-edit baseline).
- git diff --stat: only docs/adr/require-atomic-idempotent-operation-owned-mutations.md (+7/-2) and docs/specs/quest-cli-architecture.md (+2/-1) touched under docs/, plus this task's own backlog file.

AC1: satisfied — the ADR no longer asserts file layout/naming scheme "remain open"; it now states they are closed 2026-08-05 citing QCLI-25/D4, leaving only event schema and locking primitive as open in the register.
AC2: satisfied — architecture Spec's Deferred-by-design table now has "Naming scheme" as its own closed row (D4/QCLI-25, matching the row above verbatim in phrasing/link) with "Event schema" left open as its own row.
AC3: satisfied — no other row/section in either file modified; both named historical-record documents confirmed untouched via git diff.
AC4: satisfied — both gates report 0 errors/0 warnings post-edit, matching the pre-confirmed baseline.

Reviewed by an independent top-tier reviewer that re-ran both gates in the worktree and verified every AC against the resulting file text and the three-dot diff rather than the implementer's summary. Verdict: approve, all 4 ACs confirmed.

Verified: `lore validate --strict` -> 47 files, 0 errors, 0 warnings, 6 skipped; `lore check` -> 47 files, 0 errors, 0 warnings. Both match the pre-change baseline captured on the same worktree before dispatch, so the green result is attributable. Re-run after the (no-op) rebase onto origin/dev immediately before merge, per the mandatory re-verification rule.

AC2's 'follows the pattern of the row above it' was verified by md5 of column 2 of both rows (identical: e6abbf877f38b63d07ec39be7078ded6), not by eye. AC3's scope assertion was verified by `git diff --name-only` (exactly 3 files) and `grep -c '^@@'` over docs/ (exactly 2 hunks).

Date-attribution challenge: the ADR's new 'closed 2026-08-05' claim was specifically challenged at review because QCLI-38's determination postdates the QCLI-25 ADR it cites. Resolved as SUPPORTED — the delivery-graph doc already carries that exact date and attribution verbatim, QCLI-25's ADR frontmatter timestamps 2026-08-05T22:52:51.123Z, and register line 167 draws the distinction explicitly ('same decision as D4; QCLI-25, reconciled here by QCLI-38'). Closure attaches to the decision date; QCLI-34/38 are the later reconciliations. No doc/cli drift.

Non-blocking findings carried to campaign doc-9's wave log: one minor (the ADR's scope enumeration was narrowed rather than preserved-and-annotated; accepted as consistent with the already-merged QCLI-34/38 pattern in the delivery-graph doc) and three nits, one of which -- whether inline amendments must cite the directing task per CLAUDE.md's supersession convention, where repo practice is currently split -- is surfaced to the owner as a convention question rather than re-spun here.

Merged as c9353bc (PR #57).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed the stale 'file layout'/'naming scheme' open-item claims in the two documents outside the register and delivery-graph docs that still asserted them live. The atomic-mutations ADR's 'Deliberately not decided here' bundle now names only event schema and locking primitive as open, with an appended dated amendment recording that file layout and naming scheme closed 2026-08-05 by QCLI-25/D4; the architecture Spec's 'Deferred by design' table splits its combined row so Naming scheme carries the same D4-closed citation as the row above it while Event schema stays open. No historical-record document was touched, per this repo's supersession convention. Verified by an independent reviewer re-running lore validate --strict and lore check (both 47 files, 0 errors, 0 warnings, matching the pre-change baseline), md5-comparing the new table row against the row it was required to mirror, and confirming by diff that exactly two hunks across two docs were changed. Merged as c9353bc (PR #57).
<!-- SECTION:FINAL_SUMMARY:END -->
