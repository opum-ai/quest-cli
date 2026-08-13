---
id: QCLI-25
title: >-
  Author an ADR for the Quest CLI canonical identifier grammar and
  authored-record layout
status: Done
assignee:
  - '@claude'
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 23:11'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - identity
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:identity'
  - wave-1
dependencies: []
documentation:
  - >-
    docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-19 proposed the canonical identifier grammar and authored-record layout for register entry D4 but explicitly decided nothing. The component owner ruled on it in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so register entry D4 can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An accepted ADR records D4 as closed: the canonical-id grammar shape accepted as QCLI-19 proposed (fixed literal prefix, flat unpadded decimal sequence, single global counter, ASCII-only alphabet, one fixed canonical case)
- [x] #2 The ADR fixes the literal prefix as T
- [x] #3 The ADR records the authored-record layout accepted as proposed: one Git-tracked file per canonical task, filename anchored on the canonical id with an optional non-identity-bearing slug, identity-free subdirectories, and alias data co-located on the canonical record rather than a separate index
- [x] #4 The ADR records the Unicode-normalisation-plus-case-folding rules accepted as proposed: ASCII-only fold to one fixed case for canonical ids, NFC-plus-default-case-fold for aliases
- [x] #5 The ADR names QCLI-19's proposal and the owning Story as the ruling's provenance, and lists what QCLI-19 left deliberately open (D5, D7a, lease/heartbeat timing, the counter's persisted shape, whether a migrated source identifier auto-registers as an alias) as still open and not settled by this ADR
- [x] #6 lore validate --strict passes on the new ADR file
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a new ADR concept via `lore new adr "<title>"` (not manual file creation) so frontmatter/schema wiring matches repo convention; title frames the decision itself (e.g. a T-prefixed canonical identifier grammar and its authored-record layout), tags mirror QCLI-19's proposal (quest, cli, identity, identifiers, grammar, record-layout, decisions).
2. Fill Status/Context/Decision/Consequences sections, modeled on the existing ADRs (bound-claims-with-leases, keep-lore-optional, migrate-from-backlog-md). Unlike those, this ADR is NOT promoting an already-settled research finding — QCLI-19 explicitly decided nothing — so Status states plainly that this ADR ratifies the component owner's live 2026-08-05 ruling on QCLI-19's proposal, citing QCLI-19's proposal doc and the owning ratification Story as provenance (AC5).
3. Decision section states, as accepted-not-merely-recommended: the grammar shape (fixed literal prefix, flat unpadded decimal sequence, single global counter, ASCII-only alphabet, one fixed canonical case) with the literal prefix fixed as `T` (AC1, AC2); the authored-record layout (one Git-tracked file per canonical task, filename anchored on canonical id with optional non-identity-bearing slug, identity-free subdirectories, alias data co-located on the canonical record not a separate index) (AC3); and the Unicode-normalisation-plus-case-folding rules (ASCII-only fold to one fixed case for canonical ids, NFC-plus-default-case-fold for aliases) (AC4).
4. Explicitly list what stays open and is NOT settled by this ADR, matching QCLI-19's own "deliberately leaves open" list: D5 (scale target), D7a (archival/retention), lease/heartbeat timing, the counter's persisted shape, and whether a migrated source identifier auto-registers as an alias (AC5). State plainly this ADR does not freeze runtime, native packaging, or the projection storage/index engine, and does not touch D2, D6, D7a/D7b, or the not-found convention's lore-doc boundary half (scope boundary from the assignment).
5. Do NOT edit the open component decisions register, contracts graph, delivery roadmap, or any file outside the new ADR (and, if `lore new`/linking requires it, a lore-managed reference from the Story) — QCLI-28 reconciles those later.
6. Run `lore validate --strict` on the new file and fix until it passes (AC6). Re-check each AC line-by-line against the actual file text.
7. Record decisions/interpretations and validation evidence via `--append-notes`; commit with `Refs: QCLI-25` trailer(s); push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: scaffolded docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md via `lore new adr "Adopt a T-prefixed canonical identifier grammar and its authored-record layout" --tags quest,cli,identity,identifiers,grammar,record-layout,decisions`, then filled Status/Context/Decision/Consequences.

Interpretation decisions:
- Status section departs from this ADR log's usual "promotes an already-settled research finding" framing (used by e.g. bound-claims-with-leases, keep-lore-optional): QCLI-19's proposal explicitly decided nothing, so this ADR states plainly that it ratifies the component owner's live 2026-08-05 ruling on that proposal, citing QCLI-19's proposal doc and the ratify-Phase-1-decisions Story as provenance (AC5) rather than a prior research task.
- Fixed canonical case chosen as upper-case (matching the `T` prefix), per the proposal's own stated convention ("this proposal's convention: fold to upper-case").
- "What this ADR leaves open" reproduces QCLI-19's own five-item open list verbatim in substance (D5, D7a, lease/heartbeat timing, counter's persisted shape, migrated-source-identifier-as-alias), per AC5, plus an explicit out-of-scope statement covering D2/D6/D7b/not-found-lore-doc-half per the assignment's scope boundary.
- Did NOT run `lore sync` or update docs/adr/index.md's managed block. AC6 only requires `lore validate --strict` on the new file, which passes standalone. `lore sync` recomputes the owning Story's status from ALL five coupled tasks (QCLI-24..28), but this worktree only sees QCLI-25's own status change — running sync here would write a partial/incorrect Story status and managed-task-block based on incomplete concurrent state from sibling worktrees, and risk a merge conflict with the other three Phase-1 ADR workers touching the same Story file. Left that reconciliation for the campaign's settlement step (consistent with `lore sync`/index regeneration being handled by prior "chore(backlog): sync task changes" commits elsewhere in this repo's history, not by individual authoring tasks). `lore check` on the full bundle currently reports exactly this expected status-drift on the Story (2 errors, both "run `lore sync` to reconcile") and nothing else; my new ADR file itself has 0 errors/0 warnings under both `lore validate --strict` and `lore check`.

Verification:
$ lore validate --strict docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
ok docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
1 file, 0 errors, 0 warnings, 0 skipped
(exit 0)

AC-by-AC check against the file's actual text:
- AC1: Status = Accepted; Decision opens "Register entry D4 is closed" and states the grammar shape (fixed literal prefix, flat unpadded decimal sequence, single global counter, ASCII-only alphabet, one fixed canonical case) accepted as proposed.
- AC2: grammar block fixes `prefix := "T"`; prose states "Fixed literal prefix, `T`."
- AC3: "Authored-record layout" subsection states one Git-tracked file per canonical task, filename anchored on canonical id with optional non-identity-bearing slug, identity-free subdirectories, and alias data co-located on the canonical record (not a separate index).
- AC4: "Unicode normalisation and case-folding" subsection states ASCII-only fold to one fixed case for canonical ids, and NFC-plus-Unicode-default-case-fold for aliases.
- AC5: Status section names QCLI-19's proposal and the ratify-Phase-1-decisions Story as provenance; "What this ADR leaves open" lists D5, D7a, lease/heartbeat timing, the counter's persisted shape, and migrated-source-identifier-as-alias as still open.
- AC6: confirmed above, exit 0.

Out-of-scope findings (not actioned, for the orchestrator): none beyond the expected Story status-drift noted above, which QCLI-28 (or a settlement-time `lore sync`) will clear once all four Phase-1 ADR branches land.

Settlement: reviewer independently re-verified all 6 ACs against the ADR file content (docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) and re-ran 'lore validate --strict', confirming 0 errors/0 warnings. Approved on first pass — this worker correctly deferred lore sync/shared-index updates from the start, avoiding the scope-creep round its wave-1 siblings needed. Full lore sync reconciliation deferred to a single pass after all four wave-1 ADRs merge. Merged via PR #40, squash commit 9e7a0c0 on dev.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored and merged an accepted ADR (docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) recording the owner's 2026-08-05 live-session ruling closing register entry D4: canonical-id grammar shape accepted as QCLI-19 proposed (fixed literal prefix, flat unpadded decimal sequence, single global counter, ASCII-only alphabet, one fixed canonical case), prefix fixed as T; authored-record layout (one Git-tracked file per canonical task, id-anchored filename with optional non-identity slug, identity-free subdirectories, co-located alias data); Unicode normalization/case-folding rules (ASCII fold to upper-case for canonical ids, NFC+default-case-fold for aliases). Names QCLI-19's proposal and the owning Story as provenance, and lists D5/D7a/lease-heartbeat-timing/counter-persisted-shape/migrated-alias-auto-registration as still open. Verified via lore validate --strict (0 errors/0 warnings) and independent reviewer re-verification of all 6 ACs, approved on first pass. Merged PR #40 (9e7a0c0).
<!-- SECTION:FINAL_SUMMARY:END -->
