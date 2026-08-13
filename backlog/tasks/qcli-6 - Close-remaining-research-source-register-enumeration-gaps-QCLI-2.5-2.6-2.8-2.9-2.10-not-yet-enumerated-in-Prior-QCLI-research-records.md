---
id: QCLI-6
title: >-
  Close remaining research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8,
  2.9, 2.10 not yet enumerated in 'Prior QCLI research records')
status: Done
assignee: []
created_date: '2026-08-05 02:29'
updated_date: '2026-08-05 03:21'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - campaign
dependencies:
  - QCLI-2.5
  - QCLI-2.6
  - QCLI-2.8
  - QCLI-2.9
  - QCLI-2.10
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The register's "Prior QCLI research records" slice (docs/reference/quest-cli-research-source-register.md, around lines 787-829) enumerates 9 members. Five merged deliverables are relied upon by other campaign outputs without being enumerated as members of that slice:

- QCLI-2.5's Backlog migration fidelity contract (docs/reference/quest-cli-backlog-migration-fidelity-contract.md)
- QCLI-2.6's Git/filesystem/concurrency threat model (docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
- QCLI-2.8's component contracts and delivery graph (docs/reference/quest-cli-component-contracts-and-delivery-graph.md)
- QCLI-2.9's packaging contract (docs/reference/quest-cli-packaging-contract.md)
- QCLI-2.10's Backlog adoption and migration playbook (docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md)

This is the identical gap class QCLI-2.12 closed for four other documents earlier in the campaign -- the register's own text already concedes the pattern for those: previously-cited documents were "not previously named in this enumeration despite already being relied on... by merged deliverables."

Separately, the register's "Backlog.md public surface" slice does not state whether process-level responses from running the installed tool (for example, an `mcp start` stdio JSON-RPC response, used substantively by QCLI-2.5's deliverable) are an admissible evidence class either way. This was flagged independently by two reviewers across two different waves of the QCLI-2 campaign.

Neither gap currently blocks any settled task's own acceptance criteria -- both QCLI-2.8 and QCLI-2.10 already disclose the specific instance affecting them (a caveat paragraph in each, added in their own settlement pass) rather than silently relying on unenumerated coverage. This task closes the underlying gap those disclosures point at.

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12 operated under throughout its own register-coherence work. No product source, runtime dependency, executable scaffolding, package publication, or release.

For the durable pattern on how to pin a document that this same task's own passes might co-edit (i.e. anything this task edits together with the register in the same pass), see QCLI-2.12's task notes and PR #17: pin it to its own current state on this branch, as amended live through this same edit, rather than to an exact commit SHA -- a SHA pin of a co-edited sibling is structurally invalidated the instant a later commit in the same pass touches it again.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The register's "Prior QCLI research records" slice enumerates all five identified documents (QCLI-2.5, 2.6, 2.8, 2.9, and 2.10's outputs), each correctly pinned -- self-pinned to its own current state if co-edited by this same task's own passes, SHA-pinned to a specific commit otherwise
- [x] #2 The "Backlog.md public surface" slice's Permitted use states explicitly whether process-level responses from running the installed tool are an admissible evidence class, with reasoning either way
- [x] #3 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [x] #4 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Edit docs/reference/quest-cli-research-source-register.md, "Prior QCLI research records" slice (currently ~lines 787-925):
   a. Repository or URL field: append a new "Added 2026-08-04 by QCLI-6" sentence (following the existing QCLI-2.12 append convention) enumerating the five missing members as slice members: QCLI-2.5's Backlog migration fidelity contract, QCLI-2.6's Git/filesystem/concurrency threat model, QCLI-2.8's component contracts and delivery graph, QCLI-2.9's packaging contract, QCLI-2.10's Backlog adoption and migration playbook. State the same "not previously named despite already being relied on" framing QCLI-2.12 used, and note QCLI-2.8/QCLI-2.10 already flagged this exact gap as a caveat in their own settlement passes (left standing, not edited — out of this task's scope).
   b. Exact revision or retrieval date field: since this task does not itself co-edit any of the five cited documents (only the register), pin all five to an exact commit SHA (not self-pin), per AC1's "SHA-pinned to a specific commit otherwise" rule:
      - QCLI-2.5 fidelity contract -> 418c5eb (2026-08-04 15:16:00 -0500), confirmed via git show --stat touching the path
      - QCLI-2.6 threat model -> 739aa7e (2026-08-04 14:06:57 -0500)
      - QCLI-2.8 component contracts and delivery graph -> 8935551 (2026-08-04 18:54:09 -0500)
      - QCLI-2.9 packaging contract -> 3b5cd8c (2026-08-04 10:29:40 -0500) (same commit already cited for QCLI-2.2's reconciliation)
      - QCLI-2.10 adoption/migration playbook -> 8935551 (same commit as QCLI-2.8's doc; both touched in one edit)
      Update the running member-count prose in place (nine -> fourteen members; seven -> twelve commit-pinned; two members stay self-pinned: register + migration ledger, unchanged) and add the three newly-introduced distinct SHAs to the tally (eight distinct SHAs total across twelve commit-pinned members).
   c. Leave the register's own self-pin sentence and the migration ledger's self-pin explanation untouched -- this task does not co-edit the migration ledger or component charter, so no self-pin/SHA-pin decision changes for them.
2. Edit the "Backlog.md public surface" slice's Permitted use field to explicitly state that process-level responses from running the installed tool (e.g. mcp start's stdio JSON-RPC response) ARE an admissible evidence class, with reasoning: they are produced by running the tool, satisfying the same admission test the slice's own Exclusions field already applies ("a behavior observed only by reading source, not by running the tool, is not admissible"). Must not narrow QCLI-2.5's already-substantive reliance on this evidence (self-reported version, EOF-shutdown behavior from mcp start's stdio response) -- AC3's non-negotiable. Cross-reference QCLI-2.8's residual-gap note (component-contracts-and-delivery-graph.md, "Reconciliation across the ten dependencies") and QCLI-2.10's parallel note as the two reviewer-flagged instances this closes.
3. Do not touch quest-cli-component-contracts-and-delivery-graph.md, quest-cli-backlog-adoption-and-migration-playbook.md, the migration ledger, or the component charter -- out of this task's scope per its own scope boundary; their existing caveats stand as accurate records of their own settlement passes.
4. Verify: re-read the full edited "Prior QCLI research records" and "Backlog.md public surface" slices end to end against AC1-AC3 (classification fields intact, one-to-one slice-to-Classification count, no permitted use narrowed). Run lore check --strict, lore validate --strict, lore orphans; all must report zero errors/warnings/orphans.
5. Record notes, commit in small logical commits with Refs: QCLI-6 trailers, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Two edits to docs/reference/quest-cli-research-source-register.md only (no other file's content touched; docs/log.md and the Story's managed task block were mechanically re-synced by `lore sync` after the in-progress status change, not hand-edited).

AC1 -- "Prior QCLI research records" slice: added all five missing members (QCLI-2.5 fidelity contract, QCLI-2.6 threat model, QCLI-2.8 component contracts and delivery graph, QCLI-2.9 packaging contract, QCLI-2.10 adoption/migration playbook) to both the Repository or URL field (following the established QCLI-2.12 append convention) and the Exact revision or retrieval date field. None of the five is co-edited by this task, so all five are SHA-pinned (not self-pinned), per AC1's own rule and the durable Option-A pattern QCLI-2.12's task notes / PR #17 established:
  - QCLI-2.5 fidelity contract -> 418c5eb (2026-08-04T15:16:00-05:00)
  - QCLI-2.6 threat model -> 739aa7e (2026-08-04T14:06:57-05:00)
  - QCLI-2.8 component contracts and delivery graph -> 8935551 (2026-08-04T18:54:09-05:00)
  - QCLI-2.9 packaging contract -> 3b5cd8c (2026-08-04T10:29:40-05:00, same commit already pinning QCLI-2.2's reconciliation)
  - QCLI-2.10 adoption/migration playbook -> 8935551 (same commit as QCLI-2.8's doc; both touched in one edit)
  All five SHAs independently verified with `git log --format='%h %cI' -1 -- <path>` then cross-checked with `git show -s --format=%cI <sha>` and `git show --stat <sha>` (confirms the commit touches the named path) -- same method the register's own text already used for the original nine. Updated the slice's running counts in place: nine -> fourteen members, seven -> twelve commit-pinned, five -> eight distinct SHAs (three newly introduced: 418c5eb, 739aa7e, 8935551; 3b5cd8c reused for a second member). The register's own self-pin and the migration ledger's self-pin (the only two self-pinned members) are untouched -- this task does not co-edit the migration ledger or the component charter, so no self-pin/SHA-pin decision changed for them and neither file was touched.

AC2 -- "Backlog.md public surface" slice's Permitted use: added an explicit statement that process-level responses from running the installed tool (e.g. `mcp start`'s stdio JSON-RPC response) ARE an admissible evidence class, reasoning: they are observed by running the tool, not by reading source -- the same admissibility test the slice's own Exclusions field already states. Cites QCLI-2.5's fidelity contract's substantive reliance on this (self-reported version, EOF-shutdown behavior from mcp start's stdio response) as the reliance this clarification must not narrow, and cross-references QCLI-2.8's residual-gap note (component-contracts-and-delivery-graph.md, "Reconciliation across the ten dependencies") as the flagged instance being closed. Also notes admissibility-as-evidence-class is distinct from citability-as-stable-contract, and that QCLI-2.5's own self-imposed restriction on `browser`'s HTTP-probe evidence (not treating it as a citable contract) is that document's own choice, not implied by this slice.

AC3: verified via `git diff dev -- docs/reference/quest-cli-research-source-register.md | grep Classification` -- zero Classification-field lines touched (no +/- match), so the slice-to-Classification one-to-one mapping is unchanged and every existing Classification field is intact. Both edits are additive (new sentences appended to existing Permitted use / Repository-or-URL / Exact-revision fields); no existing sentence granting a permitted use was deleted or narrowed.

AC4 -- lore gates, run after both content commits, working tree clean:
  lore check --strict    -> 25 files, 0 errors, 0 warnings (exit 0)
  lore validate --strict -> 25 files, 0 errors, 0 warnings, 6 skipped (not-a-concept index/log files) (exit 0)
  lore orphans            -> 0 orphan tasks, 0 dangling links (exit 0)

Out-of-scope observation (not fixed, per this task's own scope boundary): quest-cli-component-contracts-and-delivery-graph.md's "Reconciliation across the ten dependencies" caveat and quest-cli-backlog-adoption-and-migration-playbook.md's "Sources and classification" caveat both still describe the enumeration gap and the process-level-response silence as open, since this task does not edit either document. Both caveats remain accurate as historical records of their own settlement pass (matching this campaign's own convention of leaving a prior pass's disclosed-gap prose standing rather than retroactively editing a merged deliverable) -- flagging this only so a reader comparing dates does not mistake the caveats for a currently-open gap; the register itself is now the current source of truth on both points.

Commits: 63e13f6 (mechanical lore-sync managed-block update after the in-progress status change), b7f4d9b (the substantive AC1/AC2 register edit).

Reviewer-verified settlement (orchestrator, wave 1, single-task): AC1 confirmed via independent SHA re-derivation (git log/git show) for all five members — QCLI-2.5→418c5eb, QCLI-2.6→739aa7e, QCLI-2.8→8935551, QCLI-2.9→3b5cd8c, QCLI-2.10→8935551 — none co-edited by this task's own branch, so all correctly SHA-pinned (not self-pinned); the QCLI-2.12 SHA-pinning trap does not apply here. AC2 confirmed: process-level-response admissibility stated with reasoning at the public-surface slice, verified consistent with QCLI-2.5's existing reliance. AC3 confirmed via strict field-level grep for Classification lines (zero added/removed) and full pre/post text diff of touched slices (no narrowing). AC4 re-run independently by the reviewer in the worktree: lore check --strict / lore validate --strict / lore orphans all zero errors/warnings/orphans. Merged as d4b7123 (PR #21, squash). Correction to this task's own out-of-scope note: QCLI-2.8's caveat at quest-cli-component-contracts-and-delivery-graph.md:69-96 names THREE unenumerated sources, not two -- QCLI-2.5's fidelity contract and QCLI-2.6's threat model (both closed by this task) plus the campaign Story (docs/stories/prepare-quests-clean-room-research-foundation.md), which remains unenumerated in the register. QCLI-2.8's caveat is therefore two-thirds closed, not fully superseded; a follow-up to enumerate the Story (or rule explicitly that Stories need no admission) is proposed in the campaign doc, pending user approval.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed the register enumeration gap QCLI-2.12's own text conceded existed for QCLI-2.5/2.6/2.8/2.9/2.10's deliverables, and stated explicit admissibility for process-level tool responses. Edited only docs/reference/quest-cli-research-source-register.md: (1) enumerated all five documents in the 'Prior QCLI research records' slice, each SHA-pinned to its own last-touch commit (none co-edited by this task, so the QCLI-2.12 self-pin trap did not apply); updated running counts 9->14 members, 7->12 commit-pinned, 5->8 distinct SHAs. (2) Added to the 'Backlog.md public surface' slice's Permitted use an explicit statement that process-level responses (e.g. mcp start's stdio JSON-RPC response) are admissible evidence, on the same running-vs-reading-source test the slice's Exclusions already draws, without narrowing QCLI-2.5's existing reliance. No Classification field touched; verified one-to-one via strict grep. Verified by an independent reviewer who re-derived every SHA, re-ran lore check/validate/orphans --strict (all clean), and diffed the full pre/post slice text. Merged as d4b7123 (PR #21). Left open: QCLI-2.8's caveat named a third unenumerated source (the campaign Story) that this task's scope did not cover -- proposed as a follow-up in the campaign doc.
<!-- SECTION:FINAL_SUMMARY:END -->
