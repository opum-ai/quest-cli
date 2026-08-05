---
id: QCLI-24
title: >-
  Author an ADR for the Quest CLI result contract: envelope shape, exit codes,
  not-found convention, and anomaly placement
status: Done
assignee:
  - '@claude'
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 23:10'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - cli-contract
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:cli-contract'
  - wave-1
dependencies: []
documentation:
  - >-
    docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-18 proposed the CLI result contract (envelope shape, exit-code table, Quest's own half of the not-found convention, and anomaly placement) but explicitly decided nothing, per that task's own scope. The component owner ruled on all four items in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so Phase 1's 'JSON and exits' exit criteria can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An accepted ADR records: schemaVersion as the string "1"; two separate fields kind and outcome (not QCLI-18's recommended fused <command>_<outcome-class> form) — the deviation from the recommendation and the reason for it (Kubernetes/Stripe split-field alignment) are stated explicitly, not silently substituted
- [x] #2 The ADR records payload keys result / decline / error, and the exit-code table 0 (success), 1 (decline/conflict), 2 (error), 3 (anomaly, conditional), 64 (usage error)
- [x] #3 The ADR records the not-found convention as a JSON-first decline envelope with a structured reason discriminant, Quest's own side only, and explicitly states the lore-doc boundary half (whether a future Lore adapter accepts or requires the bare exit-code-and-empty-stdout pattern) remains open and unresolved by this ADR
- [x] #4 The ADR records anomaly as a distinguishable fourth outcome value with its own exit code, and explicitly states that fully canonizing 'anomaly' as a product-wide outcome-vocabulary term remains a separate, already-routed quest-doc proposal not settled here
- [x] #5 The ADR records that create and edit commands emit the JSON envelope uniformly with every other command
- [x] #6 The ADR names QCLI-18's proposal and the owning Story as the ruling's provenance
- [x] #7 lore validate --strict passes on the new ADR file
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a new ADR concept via `lore new adr "Ratify the Quest CLI result contract: envelope, exit codes, not-found, and anomaly"` (tags: quest, cli, json, exit-codes, not-found, anomaly, phase-1, cli-contract) so lore generates a conformant frontmatter/section skeleton, mirroring the structure of the existing accepted ADR emit-three-categorical-command-outcomes-over-a-versioned-envelope.md (Status / Context / Decision / Consequences).
2. Write Status: Accepted, citing this Story (owning ruling) and QCLI-18's proposal doc as provenance (AC6).
3. Write Context: summarize QCLI-18's four open items and its own explicit non-decision, and the Kubernetes/Stripe precedent for split kind/outcome fields (grounds AC1's deviation rationale).
4. Write Decision, covering exactly the AC-required content:
   - schemaVersion as literal string \"1\" (AC1)
   - kind and outcome as two separate fields, explicitly deviating from QCLI-18's recommended fused <command>_<outcome-class> form, with the Kubernetes/Stripe split-field alignment stated as the reason (AC1)
   - payload keys result/decline/error (AC2)
   - exit-code table 0/1/2/3(conditional)/64 with meanings (AC2)
   - not-found convention: JSON-first decline envelope with a structured `reason` discriminant, explicitly scoped as Quest's own side only, with the lore-doc boundary half (bare exit-code-and-empty-stdout compatibility) explicitly called out as open/unresolved by this ADR (AC3)
   - anomaly as a distinguishable fourth outcome value with its own exit code (3), explicitly noting that canonizing \"anomaly\" as a product-wide outcome-vocabulary term is a separate, already-routed quest-doc proposal not settled here (AC4)
   - create/edit commands emit the JSON envelope uniformly with every other command (AC5)
5. Write Consequences: knock-on effects (e.g. envelope now has 4 possible payload keys once anomaly is included, exit table finalized for Phase 2 command design, what stays open: lore-doc boundary, D2/D6/D7a/D7b, quest-doc anomaly-vocabulary proposal).
6. Do NOT touch the open component decisions register, contracts graph, roadmap, or D2/D6/D7a/D7b — reconciliation is QCLI-28's job.
7. Verify: `lore validate --strict` on the new file (and bundle) must pass; re-read the file against every AC line-by-line.
8. Run `lore sync` if needed to keep managed blocks (adr/index.md, Story tasks block) coherent, then `lore check` to confirm no drift.
9. Record notes on the interpretation call for AC1's Kubernetes/Stripe justification (brief, factual: split status/type-like dual fields is a documented pattern in both APIs) since the task said not to hunt for more source material.
10. Commit (small logical commits, `Refs: QCLI-24` trailer) and push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented via `lore new adr "Ratify the Quest CLI result contract: envelope, exit codes, not-found, and anomaly" --tags quest,cli,json,exit-codes,not-found,anomaly,phase-1,cli-contract --summary "..."`, then authored Status/Context/Decision/Consequences prose (no manual frontmatter editing) at docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md.

Content maps to ACs:
- AC1: schemaVersion is the literal string "1" (QCLI-18 Option C, accepted as proposed). kind/outcome recorded as two separate fields, explicitly deviating from QCLI-18's fused `<command>_<outcome-class>` recommendation, with the Kubernetes/Stripe split-field alignment stated as the reason.
- AC2: payload keys result/decline/error, plus a fourth `anomaly` key; exit-code table 0/1/2/3(now live)/64 with meanings, matching QCLI-18's Option A table exactly.
- AC3: not-found recorded as a JSON-first decline envelope with a structured `reason` discriminant, explicitly scoped "Quest's own side only"; the lore-doc boundary half (bare exit-code-and-empty-stdout compatibility) is explicitly called out as not decided/proposed/assumed-resolved by this ADR.
- AC4: anomaly recorded as a distinguishable fourth outcome value (`outcome: "anomaly"`) with its own exit code (3) and payload key; explicitly states that canonizing "anomaly" as a product-wide outcome-vocabulary term is a separate, already-routed quest-doc proposal not settled here.
- AC5: create/edit commands recorded as emitting the JSON envelope uniformly with every other command, no special-cased path.
- AC6: Status and Context sections name both QCLI-18's proposal doc and the owning Story (Ratify the Quest CLI Phase 1 component decisions) as provenance, with links.
- AC7: verified, see below.

Interpretation calls (ACs gave no more detail than quoted, per task instructions I did not go hunting for a more detailed source):
- The Kubernetes/Stripe "split-field alignment" reason is illustrated concretely (K8s kind/apiVersion identity vs status.phase/condition outcome fields; Stripe's `object` type discriminant vs its `status` field) to make the stated rationale legible, without inventing any new decision beyond what the AC already names.
- QCLI-18's exit code `3` for anomaly was described as "conditional on item 4's recommendation being accepted"; since the owner's ruling accepts anomaly as a fourth outcome, I recorded exit code 3 as now live/unconditional, per the Story AC's own unconditional listing of "0/1/2/3 (anomaly)/64".
- Linked (did not edit) the open component decisions register, purely as a citation for what stays open (the lore-doc boundary, D2/D6/D7a/D7b) — no register/graph/roadmap content was changed; that reconciliation is explicitly QCLI-28's job.

Verification:
- `lore validate --strict docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md` -> "ok ...; 1 file, 0 errors, 0 warnings, 0 skipped", exit 0.
- `lore validate --strict` (whole bundle) -> "44 files, 0 errors, 0 warnings, 6 skipped", exit 0.
- `lore check` -> after `lore sync` (required because this task's own status change to In Progress drifted the owning Story's status/managed task block): "44 files, 0 errors, 0 warnings", exit 0.
- `lore orphans` -> "0 orphan tasks, 0 dangling links", exit 0.
- `lore sync` updated docs/adr/index.md (new ADR entry), docs/log.md, and docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md (status/managed task block only, reflecting QCLI-24's own live status) — no manual edits to those files, and the open component decisions register / contracts graph / delivery roadmap were not touched, per scope.

Out-of-scope observation (not acted on, reporting per instructions): none found beyond what the Story already identifies as QCLI-28's job.

Post-review scope correction (commit 3473030, Refs: QCLI-24):

The paragraph above stating "lore sync updated docs/adr/index.md, docs/log.md, and docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md" is no longer accurate for this branch. A reviewer correctly flagged that this branch, along with sibling wave-1 branches QCLI-26 and QCLI-27, had each independently touched those same shared managed files (index, log, Story managed table) from a partial single-task view — while QCLI-25's branch correctly left them alone, touching only its own task file and new ADR.

Per the reviewer's fix instructions, those three shared files (docs/adr/index.md, docs/log.md, docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md) were reverted to their dev-branch state on this branch. This task's diff against dev is now scoped to exactly two files: the backlog task file and the new ADR (docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md), verified via `git diff dev...HEAD --name-only`.

`lore validate --strict` was re-run scoped to just the ADR file and passed clean ("ok"; 1 file, 0 errors, 0 warnings, 0 skipped). `lore sync`/`lore check` were deliberately NOT re-run on this branch after the revert — running them would just re-dirty the reverted files and re-race the same sibling-branch conflict. The full reconciliation (index, log.md, and the Story's managed table reflecting all four wave-1 ADRs) is deferred to a single post-merge `lore sync`, done once centrally after QCLI-24, QCLI-25, QCLI-26, and QCLI-27 all merge to dev.

Settlement: reviewer independently re-verified all 7 ACs against the ADR file content (docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) and re-ran 'lore validate --strict', confirming 0 errors/0 warnings. One request_changes round was needed for shared-managed-file scope creep (docs/adr/index.md, docs/log.md, the Story's managed task table were reverted to dev's version; full lore sync reconciliation deferred to a single pass after all four wave-1 ADRs merge). Merged via PR #39, squash commit e5c790b on dev.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored and merged an accepted ADR (docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) recording the owner's 2026-08-05 live-session ruling on the Quest CLI result contract: schemaVersion "1"; separate kind/outcome fields (explicit deviation from QCLI-18's fused-form recommendation, reasoned via Kubernetes/Stripe split-field alignment); result/decline/error/anomaly payload keys with exit codes 0/1/2/3/64; not-found as a JSON-first decline envelope with a structured reason discriminant (Quest-side only, lore-doc boundary explicitly left open); anomaly as a distinguishable 4th outcome (product-wide vocabulary canonization explicitly left to the separate quest-doc proposal); create/edit JSON-envelope uniformity. Names QCLI-18's proposal and the owning Story as provenance. Verified via lore validate --strict (0 errors/0 warnings) and independent reviewer re-verification of all 7 ACs. Merged PR #39 (e5c790b).
<!-- SECTION:FINAL_SUMMARY:END -->
